import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Calendar,
  BarChart3,
  MessageSquare,
  Share2,
  Bot,
  Settings,
  Ticket,
  CreditCard,
  Briefcase,
  Building2,
  UserCheck,
  ClipboardList,
  FileText,
  DollarSign,
  Clock,
  BookOpen,
  Tag,
  Wallet,
} from 'lucide-react-native';

export type MenuItemType = {
  titleKey: string;
  route: string;
  icon: typeof LayoutDashboard;
  allowedTo: ('Admin' | 'Subscriber' | 'Employee')[];
  children?: { titleKey: string; route: string }[];
};

export const menuItems: MenuItemType[] = [
  {
    titleKey: 'Dashboard',
    route: 'Dashboard',
    icon: LayoutDashboard,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
  },
  {
    titleKey: 'Subscriptions',
    route: 'Subscriptions',
    icon: CreditCard,
    allowedTo: ['Subscriber'],
  },
  {
    titleKey: 'HR Management',
    route: 'HR',
    icon: Users,
    allowedTo: ['Subscriber', 'Employee'],
    children: [
      { titleKey: 'Employees', route: 'HR_Employees' },
      { titleKey: 'Departments', route: 'HR_Departments' },
      { titleKey: 'Positions', route: 'HR_Positions' },
      { titleKey: 'Attendances', route: 'HR_Attendances' },
      { titleKey: 'Leaves', route: 'HR_Leaves' },
      { titleKey: 'Salary', route: 'HR_Salary' },
      { titleKey: 'Requests', route: 'HR_Requests' },
    ],
  },
  {
    titleKey: 'Projects',
    route: 'Projects',
    icon: FolderKanban,
    allowedTo: ['Subscriber', 'Employee'],
  },
  {
    titleKey: 'Tasks',
    route: 'Tasks',
    icon: CheckSquare,
    allowedTo: ['Subscriber', 'Employee'],
  },
  {
    titleKey: 'Attendance',
    route: 'Attendance',
    icon: Calendar,
    allowedTo: ['Employee'],
  },
  {
    titleKey: 'Salary',
    route: 'Salary',
    icon: DollarSign,
    allowedTo: ['Employee'],
  },
  {
    titleKey: 'Short Leaves',
    route: 'Leaves',
    icon: Clock,
    allowedTo: ['Employee'],
  },
  {
    titleKey: 'Requests',
    route: 'Requests',
    icon: ClipboardList,
    allowedTo: ['Employee'],
  },
  {
    titleKey: 'Agenda',
    route: 'Agenda',
    icon: BookOpen,
    allowedTo: ['Subscriber', 'Employee'],
  },
  {
    titleKey: 'Analytics',
    route: 'Analytics',
    icon: BarChart3,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
  },
  {
    titleKey: 'Conversations',
    route: 'Conversations',
    icon: MessageSquare,
    allowedTo: ['Subscriber', 'Employee'],
  },
  {
    titleKey: 'Social Media',
    route: 'SocialMedia',
    icon: Share2,
    allowedTo: ['Subscriber', 'Employee'],
  },
  {
    titleKey: 'AI Assistant',
    route: 'AI',
    icon: Bot,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
  },
  {
    titleKey: 'Subscribers',
    route: 'Subscribers',
    icon: Tag,
    allowedTo: ['Admin'],
  },
  {
    titleKey: 'Industries',
    route: 'Industries',
    icon: Building2,
    allowedTo: ['Admin'],
  },
  {
    titleKey: 'System Admins',
    route: 'SystemAdmins',
    icon: UserCheck,
    allowedTo: ['Admin'],
  },
  {
    titleKey: 'Support Tickets',
    route: 'SupportTickets',
    icon: Ticket,
    allowedTo: ['Admin', 'Subscriber'],
  },
  {
    titleKey: 'Money Methods',
    route: 'MoneyMethods',
    icon: Wallet,
    allowedTo: ['Admin'],
  },
  {
    titleKey: 'Settings',
    route: 'Settings',
    icon: Settings,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
  },
];
