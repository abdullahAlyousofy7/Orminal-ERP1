import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { resource: 'bank_accounts', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)

    const baseWhere = scopedWhere(auth, {})
    const where: any = { ...baseWhere }

    if (q) {
      where.OR = [
        { nameAr: { contains: q } },
        { nameEn: { contains: q } },
        { bankName: { contains: q } },
        { iban: { contains: q } },
        { accountNo: { contains: q } },
      ]
    }

    const [data, total] = await Promise.all([
      db.bankAccount.findMany({
        where,
        skip,
        take: pageSize,
        include: { account: { select: { id: true, code: true, nameAr: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.bankAccount.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { resource: 'bank_accounts', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.nameAr) return badRequest('nameAr is required')
    if (!body.bankName) return badRequest('bankName is required')

    const fkCheck = await verifyTenantForeignKeys(auth, {
      accountId: body.accountId,
      currencyId: body.currencyId,
    })
    if (!fkCheck.valid) return fkCheck.error!

    const bank = await db.bankAccount.create({
      data: {
        companyId: auth.companyId,
        nameAr: body.nameAr,
        nameEn: body.nameEn,
        bankName: body.bankName,
        iban: body.iban,
        accountNo: body.accountNo,
        swiftCode: body.swiftCode,
        currencyId: body.currencyId,
        accountId: body.accountId,
        balance: body.balance ?? 0,
        active: body.active ?? true,
      },
    })
    return created(bank)
  } catch (e: any) {
    return serverError(e.message)
  }
}
