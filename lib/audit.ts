import "server-only";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { supabaseAdmin, hasSupabaseServiceConfig } from "@/lib/supabaseServer";

export type AuditEventType =
  | "UPLOAD_IMAGE_ATTEMPT"
  | "UPLOAD_IMAGE_SUCCESS"
  | "UPLOAD_IMAGE_REJECTED"
  | "CREATE_PERSON_REPORT"
  | "UPDATE_PERSON_REPORT"
  | "SEARCH_PERSON"
  | "VIEW_PERSON_DETAIL"
  | "DOWNLOAD_IMAGE"
  | "DOWNLOAD_REPORT"
  | "ADMIN_REVIEW_APPROVED"
  | "ADMIN_REVIEW_REJECTED"
  | "AUDIT_EXPORT";

type AuditMetadata = Record<string, unknown>;

export type LogAuditEventInput = {
  eventType: AuditEventType;
  actorUserId?: string | null;
  actorRole?: string | null;
  sessionHash?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  request?: Request;
  requestId?: string;
  statusCode?: number | null;
  metadata?: AuditMetadata;
};

export async function logAuditEvent(input: LogAuditEventInput): Promise<string | null> {
  if (!hasSupabaseServiceConfig) {
    return null;
  }

  const requestId = input.requestId ?? crypto.randomUUID();
  const requestHeaders = input.request ? input.request.headers : await headers();
  const ip = extractIp(requestHeaders);
  const path = input.request ? new URL(input.request.url).pathname : requestHeaders.get("x-matched-path");

  const { data, error } = await supabaseAdmin.rpc("log_audit_event", {
    p_event_type: input.eventType,
    p_actor_user_id: input.actorUserId ?? null,
    p_actor_role: input.actorRole ?? null,
    p_session_hash: input.sessionHash ?? null,
    p_entity_type: input.entityType ?? null,
    p_entity_id: input.entityId ?? null,
    p_request_id: requestId,
    p_ip: ip,
    p_audit_salt: process.env.AUDIT_SALT ?? null,
    p_user_agent: requestHeaders.get("user-agent"),
    p_referer: requestHeaders.get("referer"),
    p_origin: requestHeaders.get("origin"),
    p_method: input.request?.method ?? null,
    p_path: path,
    p_status_code: input.statusCode ?? null,
    p_geo: extractGeo(requestHeaders),
    p_device: extractDevice(requestHeaders),
    p_metadata: input.metadata ?? {}
  });

  if (error) {
    console.error("Audit log failed", error.message);
    return null;
  }

  return typeof data === "string" ? data : null;
}

export async function logAuditEventSafely(input: LogAuditEventInput): Promise<string | null> {
  try {
    return await logAuditEvent(input);
  } catch (error) {
    console.error("Audit log failed", error);
    return null;
  }
}

export function createAuditRequestId() {
  return crypto.randomUUID();
}

export function hashAuditValue(value: string) {
  const salt = process.env.AUDIT_SALT ?? "";
  return createHash("sha256").update(`${value}:${salt}`).digest("hex");
}

function extractIp(requestHeaders: Headers) {
  const headerValue =
    requestHeaders.get("x-vercel-forwarded-for") ||
    requestHeaders.get("x-forwarded-for") ||
    requestHeaders.get("x-real-ip");

  return headerValue?.split(",")[0]?.trim() || null;
}

function extractGeo(requestHeaders: Headers) {
  return removeEmptyValues({
    country: requestHeaders.get("x-vercel-ip-country"),
    region: requestHeaders.get("x-vercel-ip-country-region"),
    city: requestHeaders.get("x-vercel-ip-city"),
    latitude: requestHeaders.get("x-vercel-ip-latitude"),
    longitude: requestHeaders.get("x-vercel-ip-longitude")
  });
}

function extractDevice(requestHeaders: Headers) {
  const userAgent = requestHeaders.get("user-agent") ?? "";

  return removeEmptyValues({
    platform: requestHeaders.get("sec-ch-ua-platform"),
    mobile: requestHeaders.get("sec-ch-ua-mobile"),
    user_agent_family: inferUserAgentFamily(userAgent)
  });
}

function inferUserAgentFamily(userAgent: string) {
  if (!userAgent) return null;
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Edg/")) return "Edge";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  return "Other";
}

function removeEmptyValues(values: Record<string, string | null>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => Boolean(value)));
}
