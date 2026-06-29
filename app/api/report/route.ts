import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAuditRequestId, hashAuditValue, logAuditEventSafely } from "@/lib/audit";
import { fullNamePattern } from "@/lib/formHelpers";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";

type ReportRequestBody = {
  full_name?: string;
  cedula?: string;
  gender?: string;
  age?: number;
  birth_date?: string;
  status?: string;
  location_category?: string;
  location_detail?: string | null;
  last_known_state?: string | null;
  last_known_city?: string | null;
  last_known_parish?: string | null;
  image_url?: string | null;
  is_minor?: boolean;
  accepted_terms?: boolean;
  terms_version?: string;
  audit_metadata?: Record<string, unknown>;
};

const GENDER_OPTIONS = ["femenino", "masculino", "otro"] as const;
const STATUS_OPTIONS = ["missing", "found_alive", "deceased", "critical_health"] as const;
const LOCATION_OPTIONS = ["Hospital", "Sede Policial", "Refugio Temporal", "Escuela Habilitada", "Otro..."] as const;

type ValidReportPayload = {
  full_name: string;
  cedula: string;
  gender: (typeof GENDER_OPTIONS)[number];
  age: number;
  birth_date: string;
  status: (typeof STATUS_OPTIONS)[number];
  location_category: (typeof LOCATION_OPTIONS)[number];
  is_minor: boolean;
  accepted_terms: true;
  terms_version: string;
} & Partial<Omit<ReportRequestBody, "full_name" | "cedula" | "gender" | "age" | "birth_date" | "status" | "location_category" | "is_minor" | "accepted_terms" | "terms_version">>;

function getReportPayloadValidationErrors(body: ReportRequestBody): string[] {
  const errors: string[] = [];

  if (body.accepted_terms !== true) {
    errors.push("accepted_terms debe ser verdadero.");
  }
  if (typeof body.cedula !== "string" || body.cedula.trim().length === 0) {
    errors.push("cedula es obligatoria.");
  }
  if (typeof body.full_name !== "string" || body.full_name.trim().length === 0) {
    errors.push("full_name es obligatoria.");
  } else if (!fullNamePattern.test(body.full_name.trim())) {
    errors.push("full_name solo puede contener letras, espacios, tildes, apostrofe, punto o guion.");
  }
  if (typeof body.birth_date !== "string" || body.birth_date.trim().length === 0) {
    errors.push("birth_date es obligatoria.");
  }
  if (typeof body.age !== "number" || !Number.isFinite(body.age)) {
    errors.push("age debe ser un numero valido.");
  }
  if (typeof body.gender !== "string" || !GENDER_OPTIONS.includes(body.gender as any)) {
    errors.push("gender no es valido.");
  }
  if (typeof body.status !== "string" || !STATUS_OPTIONS.includes(body.status as any)) {
    errors.push("status no es valido.");
  }
  if (typeof body.location_category !== "string" || !LOCATION_OPTIONS.includes(body.location_category as any)) {
    errors.push("location_category no es valido.");
  }
  if (typeof body.is_minor !== "boolean") {
    errors.push("is_minor debe ser booleano.");
  }
  if (typeof body.terms_version !== "string" || body.terms_version.trim().length === 0) {
    errors.push("terms_version es obligatoria.");
  }

  return errors;
}

function isValidReportPayload(body: ReportRequestBody): body is ValidReportPayload {
  return getReportPayloadValidationErrors(body).length === 0;
}

type ReportInsertErrorInfo = {
  code: string;
  message: string;
  status: number;
};

function classifyReportInsertError(error: { code?: string; details?: string | null; message?: string | null }): ReportInsertErrorInfo {
  const code = error.code ?? "unknown_insert_error";
  const details = `${error.details ?? ""} ${error.message ?? ""}`.toLowerCase();

  if (code === "23505" || details.includes("duplicate")) {
    return {
      code: "REPORT_ALREADY_EXISTS",
      message: "Ya existe un reporte con la misma cedula y fecha de nacimiento.",
      status: 409
    };
  }

  if (code === "42501" || details.includes("row-level security") || details.includes("permission denied")) {
    return {
      code: "REPORT_RLS_DENIED",
      message: "La base de datos no permite guardar este reporte. Revisa las politicas RLS del ambiente.",
      status: 400
    };
  }

  if (
    ["22P02", "42P01", "42703", "42804", "42883", "PGRST204", "PGRST205"].includes(code) ||
    details.includes("schema cache") ||
    details.includes("column") ||
    details.includes("relation") ||
    details.includes("does not exist")
  ) {
    return {
      code: "REPORT_SCHEMA_OUTDATED",
      message: "La base de datos del ambiente no esta actualizada. Ejecuta el schema.sql en Supabase.",
      status: 400
    };
  }

  if (code === "23514" || details.includes("check constraint")) {
    return {
      code: "REPORT_CONSTRAINT_FAILED",
      message: "El reporte tiene un dato que no cumple las reglas de validacion.",
      status: 400
    };
  }

  return {
    code: "REPORT_INSERT_FAILED",
    message: "No se pudo guardar el reporte. Revisa la configuracion de Supabase del ambiente.",
    status: 400
  };
}

export async function POST(request: Request) {
  const requestId = createAuditRequestId();

  if (!hasSupabaseConfig) {
    await logAuditEventSafely({
      eventType: "CREATE_PERSON_REPORT",
      request,
      requestId,
      statusCode: 503,
      metadata: { error: "missing_supabase_public_config" }
    });

    return NextResponse.json({ error: "El servicio no esta configurado para recibir reportes." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as ReportRequestBody;

    if (!isValidReportPayload(body)) {
      const payloadErrors = getReportPayloadValidationErrors(body);

      await logAuditEventSafely({
        eventType: "CREATE_PERSON_REPORT",
        request,
        requestId,
        statusCode: 400,
        metadata: {
          error: "invalid_report_payload",
          validation_errors: payloadErrors
        }
      });

      return NextResponse.json({
        error: "Faltan datos obligatorios o el reporte no es valido.",
        details: payloadErrors
      }, { status: 400 });
    }

    const reportId = randomUUID();
    const { error } = await supabase
      .from("missing_persons")
      .insert({
        id: reportId,
        full_name: body.full_name.trim(),
        cedula: body.cedula.trim(),
        gender: body.gender,
        age: body.age,
        birth_date: body.birth_date,
        status: body.status,
        location_category: body.location_category,
        location_detail: body.location_detail,
        last_known_state: body.last_known_state,
        last_known_city: body.last_known_city,
        last_known_parish: body.last_known_parish,
        image_url: body.image_url,
        is_minor: body.is_minor,
        accepted_terms: body.accepted_terms,
        terms_version: body.terms_version
      });

    if (error) {
      const insertError = classifyReportInsertError(error);

      console.error("Report insert failed", {
        requestId,
        code: error.code,
        classification: insertError.code,
        message: error.message,
        details: error.details
      });

      await logAuditEventSafely({
        eventType: "CREATE_PERSON_REPORT",
        request,
        requestId,
        statusCode: insertError.status,
        metadata: {
          error: error.code ?? "unknown_insert_error",
          classification: insertError.code,
          details: error.details ?? error.message,
          cedula_hash: hashAuditValue(body.cedula.trim()),
          birth_date_hash: hashAuditValue(body.birth_date)
        }
      });

      return NextResponse.json({
        error: insertError.message,
        code: insertError.code,
        requestId
      }, { status: insertError.status });
    }

    await logAuditEventSafely({
      eventType: "CREATE_PERSON_REPORT",
      entityType: "missing_person",
      entityId: reportId,
      request,
      requestId,
      statusCode: 201,
      metadata: {
        status: body.status,
        is_minor: body.is_minor,
        last_known_state: body.last_known_state,
        has_image: Boolean(body.image_url),
        cedula_hash: hashAuditValue(body.cedula.trim()),
        birth_date_hash: hashAuditValue(body.birth_date),
        image: body.audit_metadata ?? null
      }
    });

    return NextResponse.json({ id: reportId, requestId }, { status: 201 });
  } catch {
    await logAuditEventSafely({
      eventType: "CREATE_PERSON_REPORT",
      request,
      requestId,
      statusCode: 500,
      metadata: { error: "unexpected_report_error" }
    });

    return NextResponse.json({ error: "No se pudo guardar el reporte." }, { status: 500 });
  }
}
