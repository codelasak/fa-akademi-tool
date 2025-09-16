import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const updatePaymentSchema = z.object({
  agreedAmount: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  paymentDate: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE"]).optional(),
  notes: z.string().optional(),
});

export async function PUT(request: NextRequest, context: any) {
  const { id } = context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await request.json();
    const data = updatePaymentSchema.parse(body);

    const payment = await prisma.schoolPayment.update({
      where: { id },
      data: {
        ...(data.agreedAmount !== undefined && {
          agreedAmount: data.agreedAmount,
        }),
        ...(data.paidAmount !== undefined && { paidAmount: data.paidAmount }),
        ...(data.paymentDate && { paymentDate: new Date(data.paymentDate) }),
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
        updatedAt: new Date(),
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

    console.error("Ödeme kaydı güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Ödeme kaydı güncellenemedi" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const { id } = context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    await prisma.schoolPayment.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Ödeme kaydı silindi" });
  } catch (error) {
    console.error("Ödeme kaydı silme hatası:", error);
    return NextResponse.json(
      { error: "Ödeme kaydı silinemedi" },
      { status: 500 },
    );
  }
}
