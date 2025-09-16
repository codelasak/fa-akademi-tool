import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { operation, users } = await request.json();

    if (!operation || !users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      details: [] as any[]
    };

    switch (operation) {
      case "create":
        for (const userData of users) {
          try {
            const user = await prisma.user.create({
              data: {
                email: userData.email,
                username: userData.email, // Use email as username
                password: await bcrypt.hash("tempPassword123", 10), // Default password
                firstName: userData.firstName || userData.name?.split(' ')[0] || "",
                lastName: userData.lastName || userData.name?.split(' ')[1] || "",
                role: userData.role || UserRole.TEACHER,
                isActive: userData.isActive ?? true,
              }
            });
            results.success++;
            results.details.push({ id: user.id, email: user.email, action: "created" });
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to create ${userData.email}: ${error}`);
          }
        }
        break;

      case "update":
        for (const userData of users) {
          try {
            const existingUser = await prisma.user.findUnique({
              where: { id: userData.id }
            });

            if (!existingUser) {
              results.failed++;
              results.errors.push(`User not found: ${userData.id}`);
              continue;
            }

            const updateData: any = {};
            if (userData.email !== undefined) updateData.email = userData.email;
            if (userData.name !== undefined) updateData.name = userData.name;
            if (userData.role !== undefined) updateData.role = userData.role;
            if (userData.schoolId !== undefined) updateData.schoolId = userData.schoolId;
            if (userData.className !== undefined) updateData.className = userData.className;
            if (userData.isActive !== undefined) updateData.isActive = userData.isActive;

            const user = await prisma.user.update({
              where: { id: userData.id },
              data: updateData
            });
            results.success++;
            results.details.push({ id: user.id, email: user.email, action: "updated" });
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to update ${userData.email || userData.id}: ${error}`);
          }
        }
        break;

      case "deactivate":
        for (const userData of users) {
          try {
            await prisma.user.update({
              where: { id: userData.id },
              data: { isActive: false }
            });
            results.success++;
            results.details.push({ id: userData.id, action: "deactivated" });
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to deactivate ${userData.id}: ${error}`);
          }
        }
        break;

      case "activate":
        for (const userData of users) {
          try {
            await prisma.user.update({
              where: { id: userData.id },
              data: { isActive: true }
            });
            results.success++;
            results.details.push({ id: userData.id, action: "activated" });
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to activate ${userData.id}: ${error}`);
          }
        }
        break;

      case "delete":
        for (const userData of users) {
          try {
            await prisma.user.delete({
              where: { id: userData.id }
            });
            results.success++;
            results.details.push({ id: userData.id, action: "deleted" });
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to delete ${userData.id}: ${error}`);
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 }
        );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Bulk user operation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}