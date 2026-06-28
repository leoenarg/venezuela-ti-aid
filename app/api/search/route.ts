import { NextResponse } from "next/server";
import { SearchResult } from "@/lib/supabaseClient";
import { createAuditRequestId, hashAuditValue, logAuditEventSafely } from "@/lib/audit";
import { hasSupabaseServiceConfig, supabaseAdmin } from "@/lib/supabaseServer";

type SearchRequestBody = {
  cedula?: string;
  birthDate?: string;
};

export async function POST(request: Request) {
  const requestId = createAuditRequestId();

  if (!hasSupabaseServiceConfig) {
    await logAuditEventSafely({
      eventType: "SEARCH_PERSON",
      request,
      requestId,
      statusCode: 503,
      metadata: { error: "missing_supabase_service_config" }
    });

    return NextResponse.json({ error: "El servicio de busqueda no esta configurado." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as SearchRequestBody;
    const cedula = body.cedula?.trim();
    const birthDate = body.birthDate;

    if (!cedula || !birthDate) {
      await logAuditEventSafely({
        eventType: "SEARCH_PERSON",
        request,
        requestId,
        statusCode: 400,
        metadata: { error: "invalid_search_payload" }
      });

      return NextResponse.json({ error: "Faltan datos para buscar." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc("search_missing_person", {
      search_cedula: cedula,
      search_birth_date: birthDate
    });

    if (error) {
      await logAuditEventSafely({
        eventType: "SEARCH_PERSON",
        request,
        requestId,
        statusCode: 400,
        metadata: {
          error: error.code,
          cedula_hash: hashAuditValue(cedula),
          birth_date_hash: hashAuditValue(birthDate)
        }
      });

      return NextResponse.json({ error: "No se pudo completar la busqueda." }, { status: 400 });
    }

    const match = Array.isArray(data) ? (data[0] as SearchResult | undefined) : undefined;

    await logAuditEventSafely({
      eventType: "SEARCH_PERSON",
      entityType: match ? "missing_person" : null,
      entityId: match?.id ?? null,
      request,
      requestId,
      statusCode: 200,
      metadata: {
        matched: Boolean(match),
        cedula_hash: hashAuditValue(cedula),
        birth_date_hash: hashAuditValue(birthDate)
      }
    });

    if (match) {
      await logAuditEventSafely({
        eventType: "VIEW_PERSON_DETAIL",
        entityType: "missing_person",
        entityId: match.id,
        request,
        requestId,
        statusCode: 200,
        metadata: {
          source: "exact_search",
          status: match.status,
          is_minor: match.is_minor,
          has_image: Boolean(match.image_url)
        }
      });
    }

    return NextResponse.json({ result: match ?? null, requestId });
  } catch {
    await logAuditEventSafely({
      eventType: "SEARCH_PERSON",
      request,
      requestId,
      statusCode: 500,
      metadata: { error: "unexpected_search_error" }
    });

    return NextResponse.json({ error: "No se pudo completar la busqueda." }, { status: 500 });
  }
}
