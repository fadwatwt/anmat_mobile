import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  CalendarCheck,
  DollarSign,
  Clock,
  ClipboardList,
  Users,
  MessageSquare,
  Share2,
  BarChart3,
  Bot,
  UserCheck,
  ShieldCheck,
  KeyRound,
  Building2,
  Tag,
  PercentCircle,
  Landmark,
  Languages,
  Bell,
  Ticket,
  CreditCard,
  Settings,
} from 'lucide-react-native';

export type MenuChildItem = {
  titleKey: string;
  route: string;
  permission?: string;
  permissionAnyOf?: string[];
  params?: Record<string, unknown>;
};

export type MenuItemType = {
  titleKey: string;
  route: string;
  icon: typeof LayoutDashboard;
  allowedTo: ('Admin' | 'Subscriber' | 'Employee')[];
  section?: string;
  permission?: string;
  permissionAnyOf?: string[];
  children?: MenuChildItem[];
};

// Source of truth: the web app sidebar menu (anmat_front-main/src/config/menuItems.js
// → dashboardSideMenuItems). Sections, order, roles and permission constraints must
// stay identical so the mobile menu matches the web exactly.
export const menuItems: MenuItemType[] = [
  // ═══════════════════════════════════════════
  // Section: Overview (نظرة عامة)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Dashboard',
    route: 'Dashboard',
    icon: LayoutDashboard,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
    section: 'Overview',
  },

  // ═══════════════════════════════════════════
  // Section: My Work (Employee only — يظهر أولاً للموظف)
  // ═══════════════════════════════════════════
  {
    titleKey: 'My Projects',
    route: 'MyProjects',
    icon: FolderKanban,
    allowedTo: ['Employee'],
    section: 'My Work',
  },
  {
    titleKey: 'My Tasks',
    route: 'MyTasks',
    icon: CheckSquare,
    allowedTo: ['Employee'],
    section: 'My Work',
  },
  {
    titleKey: 'My Agenda',
    route: 'MyAgenda',
    icon: Calendar,
    allowedTo: ['Employee'],
    section: 'My Work',
  },
  {
    titleKey: 'My Attendance',
    route: 'Attendance',
    icon: CalendarCheck,
    allowedTo: ['Employee'],
    section: 'My Work',
  },
  {
    titleKey: 'My Salary',
    route: 'Salary',
    icon: DollarSign,
    allowedTo: ['Employee'],
    section: 'My Work',
  },
  {
    titleKey: 'My Short Leaves',
    route: 'Leaves',
    icon: Clock,
    allowedTo: ['Employee'],
    section: 'My Work',
  },
  {
    titleKey: 'My Requests',
    route: 'Requests',
    icon: ClipboardList,
    allowedTo: ['Employee'],
    section: 'My Work',
  },

  // ═══════════════════════════════════════════
  // Section: Work Management (إدارة العمل)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Projects',
    route: 'Projects',
    icon: FolderKanban,
    allowedTo: ['Subscriber', 'Employee'],
    section: 'Work Management',
    permissionAnyOf: ['projects.track_all', 'projects.track_department'],
  },
  {
    titleKey: 'Tasks',
    route: 'Tasks',
    icon: CheckSquare,
    allowedTo: ['Subscriber', 'Employee'],
    section: 'Work Management',
    permissionAnyOf: ['tasks.track_all', 'tasks.track_department'],
  },
  {
    titleKey: 'Agenda',
    route: 'Agenda',
    icon: Calendar,
    allowedTo: ['Subscriber'],
    section: 'Work Management',
    permissionAnyOf: ['appointments.track_all', 'appointments.track_department'],
  },

  // ═══════════════════════════════════════════
  // Section: Team Management (إدارة الفريق)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Human Resources',
    route: 'HR',
    icon: Users,
    allowedTo: ['Subscriber', 'Employee'],
    section: 'Team Management',
    permissionAnyOf: [
      'employee_details.list',
      'departments.list',
      'teams.list',
      'positions.list',
      'meetings.list',
      'holidays.list',
    ],
    children: [
      {
        titleKey: 'Employees',
        route: 'HR_Employees',
        permissionAnyOf: ['employee_details.list'],
      },
      {
        titleKey: 'Departments',
        route: 'HR_Departments',
        permissionAnyOf: ['departments.list'],
      },
      {
        titleKey: 'Teams',
        route: 'HR_Teams',
        permissionAnyOf: ['teams.list'],
      },
      {
        titleKey: 'Positions',
        route: 'HR_Positions',
        permissionAnyOf: ['positions.list'],
      },
      {
        titleKey: 'Meetings',
        route: 'HR_Meetings',
        permissionAnyOf: ['meetings.list'],
      },
      {
        titleKey: 'Holidays',
        route: 'HR_Holidays',
        permissionAnyOf: ['holidays.list'],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // Section: Internal Communication (التواصل الداخلي)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Conversations',
    route: 'Conversations',
    icon: MessageSquare,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
    section: 'Internal Communication',
  },

  // ═══════════════════════════════════════════
  // Section: Content Management (إدارة المحتوى)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Social Media Management',
    route: 'SocialMedia',
    icon: Share2,
    allowedTo: ['Subscriber', 'Employee'],
    section: 'Content Management',
    permissionAnyOf: ['social_media_accounts.list'],
  },

  // ═══════════════════════════════════════════
  // Section: Reports & Analytics (التقارير والتحليلات)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Analytics',
    route: 'Analytics',
    icon: BarChart3,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
    section: 'Reports & Analytics',
    permissionAnyOf: ['admin.analytics.view', 'analytics.view'],
  },

  // ═══════════════════════════════════════════
  // Section: Smart Tools (الأدوات الذكية)
  // ═══════════════════════════════════════════
  {
    titleKey: 'AI Assistant',
    route: 'AI',
    icon: Bot,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
    section: 'Smart Tools',
  },

  // ═══════════════════════════════════════════
  // Section: System Administration (Admin only)
  // ═══════════════════════════════════════════
  {
    titleKey: 'System Admins',
    route: 'SystemAdmins',
    icon: UserCheck,
    allowedTo: ['Admin'],
    section: 'System Administration',
    permission: 'admin.system_admins.list',
  },
  {
    titleKey: 'Roles',
    route: 'AdminRoles',
    icon: ShieldCheck,
    allowedTo: ['Admin'],
    section: 'System Administration',
    permission: 'admin.admin_roles.list',
  },
  {
    titleKey: 'Permissions',
    route: 'AdminPermissions',
    icon: KeyRound,
    allowedTo: ['Admin'],
    section: 'System Administration',
    permission: 'admin.admin_permissions.list',
  },
  {
    titleKey: 'Industries',
    route: 'Industries',
    icon: Building2,
    allowedTo: ['Admin'],
    section: 'System Administration',
    permission: 'admin.industries.list',
  },

  // ═══════════════════════════════════════════
  // Section: Subscriptions & Payments (Admin only)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Subscribers',
    route: 'Subscribers',
    icon: Tag,
    allowedTo: ['Admin'],
    section: 'Subscriptions & Payments',
    permission: 'admin.subscribers.list',
  },
  {
    titleKey: 'Plans',
    route: 'Plans',
    icon: PercentCircle,
    allowedTo: ['Admin'],
    section: 'Subscriptions & Payments',
    permission: 'admin.subscription_plans.list',
    children: [
      {
        titleKey: 'Subscription Plans',
        route: 'Plans',
        permission: 'admin.subscription_plans.list',
        params: { tab: 'SubscriptionPlans' },
      },
      {
        titleKey: 'AI Token Plans',
        route: 'Plans',
        permission: 'admin.subscription_plans.list',
        params: { tab: 'AITokenPlans' },
      },
    ],
  },
  {
    titleKey: 'Money Receiving Methods',
    route: 'MoneyReceiving',
    icon: Landmark,
    allowedTo: ['Admin'],
    section: 'Subscriptions & Payments',
  },
  {
    titleKey: 'Translations',
    route: 'Translations',
    icon: Languages,
    allowedTo: ['Admin'],
    section: 'Subscriptions & Payments',
  },

  // ═══════════════════════════════════════════
  // Section: Administration (Subscriber & Employee)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Roles',
    route: 'Roles',
    icon: ShieldCheck,
    allowedTo: ['Subscriber', 'Employee'],
    section: 'Administration',
    permissionAnyOf: ['roles.list'],
  },
  {
    titleKey: 'Permissions',
    route: 'Permissions',
    icon: KeyRound,
    allowedTo: ['Subscriber'],
    section: 'Administration',
  },

  // ═══════════════════════════════════════════
  // Section: Support (الدعم)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Notifications',
    route: 'Notifications',
    icon: Bell,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
    section: 'Support',
  },
  {
    titleKey: 'Support Tickets',
    route: 'SupportTickets',
    icon: Ticket,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
    section: 'Support',
    permission: 'admin.support_tickets.list',
  },

  // ═══════════════════════════════════════════
  // Section: Settings (أسفل القائمة)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Subscriptions',
    route: 'Subscriptions',
    icon: CreditCard,
    allowedTo: ['Subscriber'],
    section: 'Settings',
  },
  {
    titleKey: 'Settings',
    route: 'Settings',
    icon: Settings,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
    section: 'Settings',
  },
];
