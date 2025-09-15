import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@/generated/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        teacherProfile: true,
        principalProfile: {
          include: {
            school: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      schoolId,
      hourlyRate,
      specializations,
    } = body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role-specific profiles
    const userData: any = {
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role as UserRole,
      isActive: true,
    };

    if (role === "TEACHER") {
      userData.teacherProfile = {
        create: {
          hourlyRate: hourlyRate || 0,
          specializations: specializations || [],
        },
      };
    } else if (role === "PRINCIPAL" && schoolId) {
      userData.principalProfile = {
        create: {
          schoolId,
        },
      };
    }

    const user = await prisma.user.create({
      data: userData,
      include: {
        teacherProfile: true,
        principalProfile: {
          include: {
            school: true,
          },
        },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}