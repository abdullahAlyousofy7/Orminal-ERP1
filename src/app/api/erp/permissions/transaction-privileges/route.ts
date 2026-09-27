import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'
import { writeAudit } from '@/lib/erp/audit'
import { TRANSACTION_POLICY_DEFINITIONS, POLICY_BY_KEY } from '@/lib/erp/screen-catalog'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const url = new URL(req.url)
    const roleId = url.searchParams.get('roleId')
    const userId = url.searchParams.get('userId')
    const q = url.searchParams.get('q')

    let policies = TRANSACTION_POLICY_DEFINITIONS
    if (q) {
      const qLower = q.toLowerCase()
      policies = policies.filter(
        (p) =>
          p.key.toLowerCase().includes(qLower) ||
          p.nameAr.includes(q) ||
          p.nameEn.toLowerCase().includes(qLower)
      )
    }

    // Fetch existing persisted values
    const where: any = { companyId: auth.companyId }
    if (roleId) where.roleId = roleId
    else if (userId) where.userId = userId

    let valuesMap = new Map<string, any>()
    if (roleId || userId) {
      const dbPolicies = await db.transactionPolicy.findMany({ where })
      for (const p of dbPolicies) {
        valuesMap.set(p.policyKey, p)
      }
    }

    const rows = policies.map((def, idx) => {
      const stored = valuesMap.get(def.key)
      let currentValue = def.defaultValue

      if (stored) {
        if (def.dataType === 'boolean') {
          currentValue = stored.boolValue !== null ? Boolean(stored.boolValue) : def.defaultValue
        } else if (def.dataType === 'integer' || def.dataType === 'decimal') {
          currentValue = stored.numValue !== null ? Number(stored.numValue) : def.defaultValue
        } else {
          currentValue = stored.strValue !== null ? stored.strValue : def.defaultValue
        }
      }

      // Generate localized display description
      let displayDesc = String(currentValue)
      if (def.dataType === 'boolean') {
        displayDesc = currentValue ? 'نعم' : 'لا'
      } else if (def.options) {
        const opt = def.options.find((o) => o.value === currentValue)
        if (opt) displayDesc = opt.label
      }

      return {
        index: idx + 1,
        policyKey: def.key,
        nameAr: def.nameAr,
        nameEn: def.nameEn,
        dataType: def.dataType,
        module: def.module,
        options: def.options,
        value: currentValue,
        displayDesc,
        description: def.description,
      }
    })

    return NextResponse.json({
      data: rows,
      total: rows.length,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          page: 1,
          pageSize: rows.length,
          total: rows.length,
          totalPages: 1,
          hasMore: false,
        },
      },
    })
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    const { roleId, userId, updates } = body

    if (!roleId && !userId) return badRequest('يجب تحديد معرف المجموعة أو المستخدم')
    if (!updates || !Array.isArray(updates)) return badRequest('مصفوفة التحديثات مطلوبة')

    await db.$transaction(
      updates.map((item: any) => {
        const def = POLICY_BY_KEY.get(item.policyKey)
        const boolValue = def?.dataType === 'boolean' ? Boolean(item.value) : null
        const numValue =
          def?.dataType === 'integer' || def?.dataType === 'decimal' ? Number(item.value) : null
        const strValue =
          def?.dataType === 'string' || def?.dataType === 'enum' ? String(item.value) : null

        return db.transactionPolicy.upsert({
          where: {
            companyId_roleId_policyKey: roleId
              ? { companyId: auth.companyId, roleId, policyKey: item.policyKey }
              : undefined,
            // fallback if user override
            id: item.id || '__NO_ID__',
          },
          create: {
            companyId: auth.companyId,
            roleId: roleId || null,
            userId: userId || null,
            policyKey: item.policyKey,
            boolValue,
            numValue,
            strValue,
          },
          update: {
            boolValue,
            numValue,
            strValue,
          },
        })
      })
    )

    await writeAudit({
      userId: auth.userId,
      companyId: auth.companyId,
      moduleCode: 'SECURITY',
      documentType: 'TRANSACTION_POLICIES',
      documentId: roleId || userId,
      action: 'update',
      reason: `Updated ${updates.length} transaction policies for ${roleId ? 'role: ' + roleId : 'user: ' + userId}`,
    })

    return ok({ success: true, count: updates.length })
  } catch (e: any) {
    return serverError(e.message)
  }
}
