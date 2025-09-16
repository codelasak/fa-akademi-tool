import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "YÖNETİM",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        items: [
          {
            title: "Ana Sayfa",
            url: "/admin/dashboard",
          },
        ],
      },
      {
        title: "Kullanıcı Yönetimi",
        icon: Icons.User,
        items: [
          {
            title: "Kullanıcılar",
            url: "/admin/users",
          },
          {
            title: "Yeni Kullanıcı",
            url: "/admin/users/create",
          },
        ],
      },
      {
        title: "Okul Yönetimi",
        icon: Icons.FourCircle,
        items: [
          {
            title: "Okullar",
            url: "/admin/schools",
          },
          {
            title: "Sınıflar",
            url: "/admin/classes",
          },
          {
            title: "Öğrenciler",
            url: "/admin/students",
          },
        ],
      },
      {
        title: "Finans",
        icon: Icons.PieChart,
        items: [
          {
            title: "Okul Ödemeleri",
            url: "/admin/finance/school-payments",
          },
          {
            title: "Öğretmen Hakedişleri",
            url: "/admin/finance/teacher-salaries",
          },
        ],
      },
    ],
  },
  {
    label: "EĞİTİM",
    items: [
      {
        title: "Ders Yönetimi",
        icon: Icons.Calendar,
        items: [
          {
            title: "Takvim",
            url: "/admin/lessons/calendar",
          },
          {
            title: "Müfredat",
            url: "/admin/curriculum",
          },
          {
            title: "Ders Kayıtları",
            url: "/admin/lessons",
          },
        ],
      },
      {
        title: "Yoklama",
        icon: Icons.Table,
        items: [
          {
            title: "Yoklama Listesi",
            url: "/admin/attendance",
          },
          {
            title: "Devamsızlık Raporu",
            url: "/admin/attendance/reports",
          },
        ],
      },
    ],
  },
  {
    label: "RAPORLAR",
    items: [
      {
        title: "Ders Raporları",
        icon: Icons.Alphabet,
        items: [
          {
            title: "İlerleme Raporu",
            url: "/admin/reports/progress",
          },
          {
            title: "Öğretmen Raporu",
            url: "/admin/reports/teachers",
          },
        ],
      },
      {
        title: "Mali Raporlar",
        icon: Icons.PieChart,
        items: [
          {
            title: "Ödeme Durumu",
            url: "/admin/reports/payments",
          },
          {
            title: "Hakediş Raporu",
            url: "/admin/reports/salaries",
          },
        ],
      },
    ],
  },
];
