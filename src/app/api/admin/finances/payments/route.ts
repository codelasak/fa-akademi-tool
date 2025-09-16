import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const createPaymentSchema = z.object({
  schoolId: z.string().min(1, "Okul seçimi gerekli"),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  agreedAmount: z.number().min(0, "Anlaşılan tutar pozitif olmalı"),
  notes: z.string().optional(),
});

const updatePaymentSchema = z.object({
  paidAmount: z.number().min(0).optional(),
  paymentDate: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE"]).optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const schoolId = searchParams.get("schoolId");
    const status = searchParams.get("status");

    const where: any = {};
    if (month && year) {
      where.month = parseInt(month);
      where.year = parseInt(year);
    }
    if (schoolId) {
      where.schoolId = schoolId;
    }
    if (status) {
      where.status = status;
    }

    const payments = await prisma.schoolPayment.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            district: true,
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Ödeme kayıtları getirme hatası:", error);
    return NextResponse.json(
      { error: "Ödeme kayıtları getirilemedi" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await request.json();
    const data = createPaymentSchema.parse(body);

    // Check if payment record already exists
    const existingPayment = await prisma.schoolPayment.findUnique({
      where: {
        schoolId_month_year: {
          schoolId: data.schoolId,
          month: data.month,
          year: data.year,
        },
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "Bu dönem için zaten ödeme kaydı var" },
        { status: 400 },
      );
    }

    const payment = await prisma.schoolPayment.create({
      data: {
        schoolId: data.schoolId,
        month: data.month,
        year: data.year,
        agreedAmount: data.agreedAmount,
        notes: data.notes,
        status: "PENDING",
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            district: true,
          },
        },
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }

    console.error("Ödeme kaydı oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Ödeme kaydı oluşturulamadı" },
      { status: 500 },
    );
  }
}
