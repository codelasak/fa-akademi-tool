import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function AdminUsers() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "TEACHER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "PRINCIPAL":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Yönetici";
      case "TEACHER":
        return "Öğretmen";
      case "PRINCIPAL":
        return "Okul Müdürü";
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Kullanıcı Yönetimi
        </h1>
        <Link
          href="/admin/users/create"
          className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
        >
          Yeni Kullanıcı Ekle
        </Link>
      </div>

      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Kullanıcı
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Rol
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Kullanıcı Adı
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Durum
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Oluşturulma
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-4">
                      <div>
                        <div className="font-medium text-dark dark:text-white">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      {user.username}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          user.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {user.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/users/${user.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Düzenle
                        </Link>
                        <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}