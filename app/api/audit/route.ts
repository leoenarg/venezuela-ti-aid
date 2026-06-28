import { NextResponse } from "next/server";
import { AuditEventType, createAuditRequestId, logAuditEventSafely } from "@/lib/audit";

const allowedClientEvents: AuditEventType[] = ["UPLOAD_IMAGE_ATTEMPT", "UPLOAD_IMAGE_SUCCESS", "UPLOAD_IMAGE_REJECTED"];

type AuditRequestBody = {
  eventType?: AuditEventType;
  entityType?: string | null;
  entityId?: string | null;
  statusCode?: number | null;
  metadata?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const requestId = createAuditRequestId();

  try {
    const body = (await request.json()) as AuditRequestBody;

    if (!body.eventType || !allowedClientEvents.includes(body.eventType)) {
      return NextResponse.json({ error: "Evento de auditoria no permitido." }, { status: 400 });
    }

    await logAuditEventSafely({
      eventType: body.eventType,
      entityType: body.entityType ?? null,
      entityId: body.entityId ?? null,
      request,
      requestId,
      statusCode: body.statusCode ?? 200,
      metadata: body.metadata ?? {}
    });

    return NextResponse.json({ ok: true, requestId });
  } catch {
    await logAuditEventSafely({
      eventType: "UPLOAD_IMAGE_REJECTED",
      request,
      requestId,
      statusCode: 400,
      metadata: { reason: "invalid_audit_payload" }
    });

    return NextResponse.json({ error: "No se pudo registrar la auditoria." }, { status: 400 });
  }
}
