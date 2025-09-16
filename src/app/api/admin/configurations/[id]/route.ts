import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { key, type, value, description, category, isSensitive, isActive } = body;

    // Check if configuration exists
    const existing = await prisma.systemConfiguration.findUnique({
      where: { id: id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    // Check if new key conflicts with existing configuration
    if (key !== existing.key) {
      const keyConflict = await prisma.systemConfiguration.findUnique({
        where: { key }
      });

      if (keyConflict) {
        return NextResponse.json(
          { error: "Configuration key already exists" },
          { status: 400 }
        );
      }
    }

    // Update configuration
    const configuration = await prisma.systemConfiguration.update({
      where: { id: id },
      data: {
        key,
        type,
        value,
        description: description || null,
        category,
        isSensitive: isSensitive || false,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json(configuration);
  } catch (error) {
    console.error("Error updating configuration:", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if configuration exists
    const existing = await prisma.systemConfiguration.findUnique({
      where: { id: id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    // Delete configuration
    await prisma.systemConfiguration.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting configuration:", error);
    return NextResponse.json(
      { error: "Failed to delete configuration" },
      { status: 500 }
    );
  }
}