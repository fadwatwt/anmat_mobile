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
  title: string;
  route: string;
  icon: typeof LayoutDashboard;
  allowedTo: ('Admin' | 'Subscriber' | 'Employee')[];
  children?: { title: string; route: string }[];
};

export const menuItems: MenuItemType[] = [
  {
    title: 'Dashboard',
    route: 'Dashboard',
    icon: LayoutDashboard,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
  },
  {
    title: 'Subscriptions',
    route: 'Subscriptions',
    icon: CreditCard,
    allowedTo: ['Subscriber'],
  },
  {
    title: 'HR Management',
    route: 'HR',
    icon: Users,
    allowedTo: ['Subscriber', 'Employee'],
    children: [
      { title: 'Employees', route: 'HR_Employees' },
      { title: 'Departments', route: 'HR_Departments' },
      { title: 'Positions', route: 'HR_Positions' },
      { title: 'Attendances', route: 'HR_Attendances' },
      { title: 'Leaves', route: 'HR_Leaves' },
      { title: 'Salary', route: 'HR_Salary' },
      { title: 'Requests', route: 'HR_Requests' },
    ],
  },
  {
    title: 'Projects',
    route: 'Projects',
    icon: FolderKanban,
    allowedTo: ['Subscriber', 'Employee'],
  },
  {
    title: 'Tasks',
    route: 'Tasks',
    icon: CheckSquare,
    allowedTo: ['Subscriber', 'Employee'],
  },
  {
    title: 'Attendance',
    route: 'Attendance',
    icon: Calendar,
    allowedTo: ['Employee'],
  },
  {
    title: 'Salary',
    route: 'Salary',
    icon: DollarSign,
    allowedTo: ['Employee'],
  },
  {
    title: 'Short Leaves',
    route: 'Leaves',
    icon: Clock,
    allowedTo: ['Employee'],
  },
  {
    title: 'Requests',
    route: 'Requests',
    icon: ClipboardList,
    allowedTo: ['Employee'],
  },
  {
    title: 'Agenda',
    route: 'Agenda',
    icon: BookOpen,
    allowedTo: ['Subscriber', 'Employee'],
  },
  {
    title: 'Analytics',
    route: 'Analytics',
    icon: BarChart3,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
  },
  {
    title: 'Conversations',
    route: 'Conversations',
    icon: MessageSquare,
    allowedTo: ['Subscriber', 'Employee'],
  },
  {
    title: 'Social Media',
    route: 'SocialMedia',
    icon: Share2,
    allowedTo: ['Subscriber', 'Employee'],
  },
  {
    title: 'AI Assistant',
    route: 'AI',
    icon: Bot,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
  },
  {
    title: 'Subscribers',
    route: 'Subscribers',
    icon: Tag,
    allowedTo: ['Admin'],
  },
  {
    title: 'Industries',
    route: 'Industries',
    icon: Building2,
    allowedTo: ['Admin'],
  },
  {
    title: 'System Admins',
    route: 'SystemAdmins',
    icon: UserCheck,
    allowedTo: ['Admin'],
  },
  {
    title: 'Support Tickets',
    route: 'SupportTickets',
    icon: Ticket,
    allowedTo: ['Admin', 'Subscriber'],
  },
  {
    title: 'Money Methods',
    route: 'MoneyMethods',
    icon: Wallet,
    allowedTo: ['Admin'],
  },
  {
    title: 'Settings',
    route: 'Settings',
    icon: Settings,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
  },
];
