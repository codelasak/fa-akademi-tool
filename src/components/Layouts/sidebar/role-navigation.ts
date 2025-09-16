import { UserRole } from "@/generated/prisma";
import { SettingsIcon, DatabaseIcon, ActivityIcon, ShieldIcon } from "./icons";

export interface NavigationItem {
  title: string;
  url: string;
  icon?: React.ComponentType<any>;
}

export interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

export interface NavigationGroup {
  title: string;
  icon: React.ComponentType<any>;
  items: NavigationItem[];
}

export interface RoleNavigation {
  ADMIN?: NavigationGroup[];
  TEACHER?: NavigationGroup[];
  PRINCIPAL?: NavigationGroup[];
}

export const ADMIN_NAVIGATION: RoleNavigation['ADMIN'] = [
  {
    title: "Dashboard",
    icon: require("./icons").HomeIcon,
    items: [
      { title: "Ana Sayfa", url: "/admin/dashboard" },
    ],
  },
  {
    title: "Kullanıcı Yönetimi",
    icon: require("./icons").User,
    items: [
      { title: "Kullanıcılar", url: "/admin/users" },
      { title: "Yeni Kullanıcı", url: "/admin/users/create" },
    ],
  },
  {
    title: "Okul Yönetimi",
    icon: require("./icons").FourCircle,
    items: [
      { title: "Okullar", url: "/admin/schools" },
      { title: "Sınıflar", url: "/admin/classes" },
      { title: "Öğrenciler", url: "/admin/students" },
    ],
  },
  {
    title: "Öğretmen Yönetimi",
    icon: require("./icons").User,
    items: [
      { title: "Öğretmenler", url: "/admin/teachers" },
      { title: "Atamalar", url: "/admin/teacher-assignments" },
    ],
  },
  {
    title: "Finans",
    icon: require("./icons").PieChart,
    items: [
      { title: "Ödemeler", url: "/admin/finances/payments" },
      { title: "Hakedişler", url: "/admin/finances/wages" },
    ],
  },
  {
    title: "Yoklama Politikaları",
    icon: require("./icons").Table,
    items: [
      { title: "Politikalar", url: "/admin/attendance-policies" },
      { title: "Yeni Politika", url: "/admin/attendance-policies/create" },
    ],
  },
  {
    title: "Raporlar",
    icon: require("./icons").Alphabet,
    items: [
      { title: "Yoklama Raporları", url: "/admin/reports" },
      { title: "Mali Raporlar", url: "/admin/finances" },
    ],
  },
  {
    title: "Sistem Ayarları",
    icon: SettingsIcon,
    items: [
      { title: "Yapılandırma", url: "/admin/system/configuration" },
      { title: "Denetim Kayıtları", url: "/admin/system/audit-logs" },
      { title: "Sistem Monitörü", url: "/admin/system/monitoring" },
      { title: "Yedekleme", url: "/admin/system/backup" },
    ],
  },
  {
    title: "Sistem İşlemleri",
    icon: DatabaseIcon,
    items: [
      { title: "Kullanıcı İşlemleri", url: "/admin/system/bulk-users" },
      { title: "Parola Sıfırlama", url: "/admin/system/password-reset" },
    ],
  },
];

export const TEACHER_NAVIGATION: RoleNavigation['TEACHER'] = [
  {
    title: "Dashboard",
    icon: require("./icons").HomeIcon,
    items: [
      { title: "Ana Sayfa", url: "/teacher/dashboard" },
    ],
  },
  {
    title: "Ders Yönetimi",
    icon: require("./icons").Calendar,
    items: [
      { title: "Derslerim", url: "/teacher/lessons" },
      { title: "Ders Kaydet", url: "/teacher/lessons/record" },
    ],
  },
  {
    title: "Yoklama",
    icon: require("./icons").Table,
    items: [
      { title: "Yoklama", url: "/teacher/attendance" },
      { title: "Toplu Yoklama", url: "/teacher/attendance/bulk" },
      { title: "Yoklama Raporları", url: "/teacher/attendance/reports" },
    ],
  },
  {
    title: "Müfredat",
    icon: require("./icons").Alphabet,
    items: [
      { title: "Müfredatım", url: "/teacher/curriculum" },
    ],
  },
];

export const PRINCIPAL_NAVIGATION: RoleNavigation['PRINCIPAL'] = [
  {
    title: "Dashboard",
    icon: require("./icons").HomeIcon,
    items: [
      { title: "Ana Sayfa", url: "/principal" },
    ],
  },
  {
    title: "Okul Yönetimi",
    icon: require("./icons").FourCircle,
    items: [
      { title: "Okulum", url: "/principal/school" },
      { title: "Öğretmenler", url: "/principal/teachers" },
      { title: "Sınıflar", url: "/principal/classes" },
      { title: "Öğrenciler", url: "/principal/students" },
    ],
  },
  {
    title: "Raporlar",
    icon: require("./icons").Alphabet,
    items: [
      { title: "Raporlarım", url: "/principal/reports" },
    ],
  },
];

export const ROLE_NAVIGATION: RoleNavigation = {
  ADMIN: ADMIN_NAVIGATION,
  TEACHER: TEACHER_NAVIGATION,
  PRINCIPAL: PRINCIPAL_NAVIGATION,
};