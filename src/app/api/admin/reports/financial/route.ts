import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const financialReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  reportType: z.enum(["wages", "payments", "summary"]).default("summary"),
  schoolId: z.string().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "PRINCIPAL"].includes(session.user.role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await request.json();
    const data = financialReportSchema.parse(body);

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    let report: any = {
      metadata: {
        reportType: "financial",
        subType: data.reportType,
        dateRange: {
          start: data.startDate,
          end: data.endDate,
        },
        generatedAt: new Date().toISOString(),
        generatedBy: session.user.email,
        filters: {
          schoolId: data.schoolId,
        },
      },
    };

    if (data.reportType === "wages" || data.reportType === "summary") {
      // Fetch wage records
      const wageWhere: any = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      // Add school filtering for wages if schoolId is provided
      if (data.schoolId) {
        wageWhere.teacher = {
          assignments: {
            some: {
              schoolId: data.schoolId,
              isActive: true
            }
          }
        };
      }

      const wageRecords = await prisma.teacherWageRecord.findMany({
        where: wageWhere,
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              assignments: {
                include: {
                  school: {
                    select: {
                      id: true,
                      name: true,
                      district: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          { year: "desc" },
          { month: "desc" },
        ],
      });

      // Calculate wage analytics
      const wageAnalytics = {
        totalWages: wageRecords.reduce((sum, w) => sum + parseFloat(w.totalAmount.toString()), 0),
        totalPaid: wageRecords.reduce((sum, w) => sum + parseFloat(w.paidAmount.toString()), 0),
        totalPending: wageRecords.filter(w => w.status === "PENDING").reduce((sum, w) => sum + parseFloat(w.totalAmount.toString()), 0),
        totalOverdue: wageRecords.filter(w => w.status === "OVERDUE").reduce((sum, w) => sum + parseFloat(w.totalAmount.toString()), 0),
        totalHours: wageRecords.reduce((sum, w) => sum + parseFloat(w.totalHours.toString()), 0),
        averageHourlyRate: wageRecords.length > 0 
          ? wageRecords.reduce((sum, w) => sum + parseFloat(w.hourlyRate.toString()), 0) / wageRecords.length
          : 0,
        recordCount: wageRecords.length,
        teacherCount: new Set(wageRecords.map(w => w.teacherId)).size,
      };

      report.wageData = {
        analytics: wageAnalytics,
        records: wageRecords,
      };
    }

    if (data.reportType === "payments" || data.reportType === "summary") {
      // Fetch payment records
      const paymentWhere: any = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (data.schoolId) {
        paymentWhere.schoolId = data.schoolId;
      }

      const paymentRecords = await prisma.schoolPayment.findMany({
        where: paymentWhere,
        include: {
          school: {
            select: {
              id: true,
              name: true,
              district: true,
            },
          },
        },
        orderBy: [
          { year: "desc" },
          { month: "desc" },
        ],
      });

      // Calculate payment analytics
      const paymentAnalytics = {
        totalRevenue: paymentRecords.reduce((sum, p) => sum + parseFloat(p.agreedAmount.toString()), 0),
        totalReceived: paymentRecords.reduce((sum, p) => sum + parseFloat(p.paidAmount.toString()), 0),
        totalPending: paymentRecords.filter(p => p.status === "PENDING").reduce((sum, p) => sum + parseFloat(p.agreedAmount.toString()), 0),
        totalOverdue: paymentRecords.filter(p => p.status === "OVERDUE").reduce((sum, p) => sum + parseFloat(p.agreedAmount.toString()), 0),
        recordCount: paymentRecords.length,
        schoolCount: new Set(paymentRecords.map(p => p.schoolId)).size,
        averagePayment: paymentRecords.length > 0 
          ? paymentRecords.reduce((sum, p) => sum + parseFloat(p.agreedAmount.toString()), 0) / paymentRecords.length
          : 0,
      };

      report.paymentData = {
        analytics: paymentAnalytics,
        records: paymentRecords,
      };
    }

    if (data.reportType === "summary") {
      // Calculate overall financial health
      const totalIncome = report.paymentData?.analytics.totalReceived || 0;
      const totalExpenses = report.wageData?.analytics.totalPaid || 0;
      const netResult = totalIncome - totalExpenses;
      
      const outstandingReceivables = report.paymentData?.analytics.totalPending || 0;
      const outstandingPayables = report.wageData?.analytics.totalPending || 0;
      
      report.summary = {
        totalIncome,
        totalExpenses,
        netResult,
        netMargin: totalIncome > 0 ? (netResult / totalIncome * 100) : 0,
        outstandingReceivables,
        outstandingPayables,
        netOutstanding: outstandingReceivables - outstandingPayables,
        cashFlow: {
          incoming: outstandingReceivables,
          outgoing: outstandingPayables,
          net: outstandingReceivables - outstandingPayables,
        },
      };
    }

    if (data.format === "csv") {
      let csvContent = "";
      let filename = `financial-report-${data.reportType}-${data.startDate}-${data.endDate}.csv`;

      if (data.reportType === "wages") {
        const headers = [
          "Teacher Name",
          "Email", 
          "Month",
          "Year",
          "Total Hours",
          "Hourly Rate",
          "Total Amount",
          "Paid Amount",
          "Status",
          "Payment Date"
        ];
        
        const rows = report.wageData.records.map((record: any) => [
          `${record.teacher.user.firstName} ${record.teacher.user.lastName}`,
          record.teacher.user.email,
          record.month,
          record.year,
          record.totalHours,
          record.hourlyRate,
          record.totalAmount,
          record.paidAmount,
          record.status,
          record.paymentDate ? new Date(record.paymentDate).toLocaleDateString('tr-TR') : ""
        ]);

        csvContent = [headers, ...rows]
          .map(row => row.map((cell: any) => `"${cell}"`).join(","))
          .join("\n");
      } else if (data.reportType === "payments") {
        const headers = [
          "School Name",
          "District",
          "Month", 
          "Year",
          "Agreed Amount",
          "Paid Amount",
          "Status",
          "Payment Date"
        ];
        
        const rows = report.paymentData.records.map((record: any) => [
          record.school.name,
          record.school.district,
          record.month,
          record.year,
          record.agreedAmount,
          record.paidAmount,
          record.status,
          record.paymentDate ? new Date(record.paymentDate).toLocaleDateString('tr-TR') : ""
        ]);

        csvContent = [headers, ...rows]
          .map(row => row.map((cell: any) => `"${cell}"`).join(","))
          .join("\n");
      } else if (data.reportType === "summary") {
        // Generate combined CSV for summary report
        const headers = [
          "Type",
          "Description",
          "Amount (TRY)",
          "Status",
          "Details"
        ];
        
        const rows: any[] = [];
        
        // Add summary metrics
        if (report.summary) {
          rows.push(["Income", "Total Income", report.summary.totalIncome, "Completed", "Total received payments"]);
          rows.push(["Expense", "Total Expenses", report.summary.totalExpenses, "Completed", "Total paid wages"]);
          rows.push(["Net Result", "Net Profit/Loss", report.summary.netResult, report.summary.netResult >= 0 ? "Positive" : "Negative", `Net margin: ${report.summary.netMargin.toFixed(1)}%`]);
          rows.push(["Outstanding", "Receivables", report.summary.outstandingReceivables, "Pending", "Unpaid school payments"]);
          rows.push(["Outstanding", "Payables", report.summary.outstandingPayables, "Pending", "Unpaid teacher wages"]);
          rows.push(["Cash Flow", "Net Outstanding", report.summary.netOutstanding, report.summary.netOutstanding >= 0 ? "Positive" : "Negative", "Net cash flow position"]);
        }
        
        csvContent = [headers, ...rows]
          .map(row => row.map((cell: any) => `"${cell}"`).join(","))
          .join("\n");
      } else {
        return NextResponse.json(
          { error: "CSV formatı bu rapor türü için desteklenmiyor" },
          { status: 400 }
        );
      }

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Finansal rapor oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Rapor oluşturulamadı" },
      { status: 500 }
    );
  }
}