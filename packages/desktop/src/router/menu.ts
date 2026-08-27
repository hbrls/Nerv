export interface MenuLink {
  label: string;
  path: string;
}

export interface MenuSection {
  label: string;
  children: MenuLink[];
}

export type MenuItem = MenuLink | MenuSection;

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export const menuGroups: MenuGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: "/dashboard" },
      {
        label: "Nerv",
        children: [
          { label: "Nerv-1", path: "/nervs/nerv-1" },
          { label: "Nerv-2", path: "/nervs/nerv-2" },
          { label: "Nerv-3", path: "/nervs/nerv-3" },
          { label: "创新", path: "/nervs/innovation" },
        ],
      },
    ],
  },
  {
    label: "System",
    items: [
      { label: "System Info", path: "/system/info" },
      { label: "Command Runner", path: "/system/command" },
      { label: "Scheduler", path: "/system/scheduler" },
    ],
  },
  {
    label: "Settings",
    items: [{ label: "Appearance", path: "/settings/appearance" }],
  },
  {
    label: "Product",
    items: [{ label: "About", path: "/about" }],
  },
];
