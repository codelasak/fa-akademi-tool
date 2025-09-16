import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ConfigType } from "@/generated/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configurations = await prisma.systemConfiguration.findMany({
      orderBy: [
        { category: "asc" },
        { key: "asc" }
      ]
    });

    return NextResponse.json(configurations);
  } catch (error) {
    console.error("Error fetching configurations:", error);
    return NextResponse.json(
      { error: "Failed to fetch configurations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { key, type, value, description, category, isSensitive, isActive } = body;

    // Validate required fields
    if (!key || !type || !value || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if configuration key already exists
    const existing = await prisma.systemConfiguration.findUnique({
      where: { key }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Configuration key already exists" },
        { status: 400 }
      );
    }

    // Create configuration
    const configuration = await prisma.systemConfiguration.create({
      data: {
        key,
        type: type as ConfigType,
        value,
        description: description || null,
        category,
        isSensitive: isSensitive || false,
        isActive: isActive !== undefined ? isActive : true,
      }
    });

    return NextResponse.json(configuration, { status: 201 });
  } catch (error) {
    console.error("Error creating configuration:", error);
    return NextResponse.json(
      { error: "Failed to create configuration" },
      { status: 500 }
    );
  }
}