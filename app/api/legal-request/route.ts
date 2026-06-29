import { NextResponse } from "next/server";
import { createAuditRequestId, hashAuditValue, logAuditEventSafely } from "@/lib/audit";
import { hasSupabaseServiceConfig, supabaseAdmin } from "@/lib/supabaseServer";

type LegalRequestBody = {
  authorityFullName?: string;
  institution?: string;
  officialRole?: string;
  jurisdiction?: string;
  officialEmail?: string;
  officialPhone?: string;
  courtOrderId?: string;
  issuingCourt?: string;
  orderDate?: string;
  legalBasis?: string;
  scopeSummary?: string;
  requestedRecords?: string;
  urgency?: "normal" | "urgent";
  deliveryConstraints?: string;
  attestation?: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s{2,}/g, " ") : "";
}

function validateLegalRequest(body: LegalRequestBody) {
  const errors: string[] = [];

  const requiredText: Array<[keyof LegalRequestBody, string, number, number]> = [
    ["authorityFullName", "Nombre de la autoridad solicitante", 3, 180],
    ["institution", "Institucion", 3, 180],
    ["officialRole", "Cargo oficial", 3, 160],
    ["jurisdiction", "Jurisdiccion", 3, 180],
    ["courtOrderId", "Numero o identificador de la orden judicial", 3, 120],
    ["issuingCourt", "Tribunal o autoridad emisora", 3, 180],
    ["legalBasis", "Fundamento legal", 10, 2000],
    ["scopeSummary", "Alcance de la solicitud", 10, 3000],
    ["requestedRecords", "Registros solicitados", 10, 3000]
  ];

  for (const [field, label, min, max] of requiredText) {
    const value = normalizeText(body[field]);
    if (value.length < min || value.length > max) {
      errors.push(`${label} debe tener entre ${min} y ${max} caracteres.`);
    }
  }

  const officialEmail = normalizeText(body.officialEmail);
  if (!emailPattern.test(officialEmail) || officialEmail.length > 254) {
    errors.push("Correo oficial no es valido.");
  }

  if (!body.orderDate || Number.isNaN(new Date(body.orderDate).getTime())) {
    errors.push("Fecha de la orden judicial no es valida.");
  }

  if (body.urgency !== "normal" && body.urgency !== "urgent") {
    errors.push("Nivel de urgencia no es valido.");
  }

  if (body.attestation !== true) {
    errors.push("Debes confirmar que existe una orden judicial valida y una finalidad legal legitima.");
  }

  return errors;
}

export async function POST(request: Request) {
  const requestId = createAuditRequestId();

  if (!hasSupabaseServiceConfig) {
    await logAuditEventSafely({
      eventType: "LEGAL_DATA_REQUEST_REJECTED",
      request,
      requestId,
      statusCode: 503,
      metadata: { reason: "missing_supabase_service_config" }
    });

    return NextResponse.json({ error: "El portal legal no esta configurado para recibir solicitudes." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as LegalRequestBody;
    const errors = validateLegalRequest(body);

    if (errors.length > 0) {
      await logAuditEventSafely({
        eventType: "LEGAL_DATA_REQUEST_REJECTED",
        request,
        requestId,
        statusCode: 400,
        metadata: { reason: "invalid_legal_request", validation_errors: errors }
      });

      return NextResponse.json({ error: "La solicitud legal esta incompleta o no es valida.", details: errors }, { status: 400 });
    }

    const officialEmail = normalizeText(body.officialEmail).toLowerCase();
    const courtOrderId = normalizeText(body.courtOrderId);

    const { data, error } = await supabaseAdmin
      .schema("legal")
      .from("data_requests")
      .insert({
        authority_full_name: normalizeText(body.authorityFullName),
        institution: normalizeText(body.institution),
        official_role: normalizeText(body.officialRole),
        jurisdiction: normalizeText(body.jurisdiction),
        official_email: officialEmail,
        official_phone: normalizeText(body.officialPhone) || null,
        court_order_id: courtOrderId,
        issuing_court: normalizeText(body.issuingCourt),
        order_date: body.orderDate,
        legal_basis: normalizeText(body.legalBasis),
        scope_summary: normalizeText(body.scopeSummary),
        requested_records: normalizeText(body.requestedRecords),
        urgency: body.urgency,
        delivery_constraints: normalizeText(body.deliveryConstraints) || null,
        attestation: true,
        request_metadata: {
          intake_path: "/legal/request",
          request_id: requestId
        }
      })
      .select("id")
      .single();

    if (error) {
      console.error("Legal request insert failed", { requestId, code: error.code, message: error.message, details: error.details });

      await logAuditEventSafely({
        eventType: "LEGAL_DATA_REQUEST_REJECTED",
        request,
        requestId,
        statusCode: 400,
        metadata: {
          reason: "insert_failed",
          error: error.code ?? "unknown_insert_error",
          official_email_hash: hashAuditValue(officialEmail),
          court_order_hash: hashAuditValue(courtOrderId)
        }
      });

      return NextResponse.json({ error: "No se pudo registrar la solicitud legal." }, { status: 400 });
    }

    await logAuditEventSafely({
      eventType: "LEGAL_DATA_REQUEST_SUBMITTED",
      entityType: "legal_data_request",
      entityId: data.id,
      request,
      requestId,
      statusCode: 201,
      metadata: {
        urgency: body.urgency,
        institution_hash: hashAuditValue(normalizeText(body.institution)),
        official_email_hash: hashAuditValue(officialEmail),
        court_order_hash: hashAuditValue(courtOrderId)
      }
    });

    return NextResponse.json({ id: data.id, requestId }, { status: 201 });
  } catch {
    await logAuditEventSafely({
      eventType: "LEGAL_DATA_REQUEST_REJECTED",
      request,
      requestId,
      statusCode: 500,
      metadata: { reason: "unexpected_legal_request_error" }
    });

    return NextResponse.json({ error: "No se pudo registrar la solicitud legal." }, { status: 500 });
  }
}
