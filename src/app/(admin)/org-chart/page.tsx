'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';

// Types
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  firstNameAr?: string;
  lastNameAr?: string;
  email?: string;
  phone?: string;
  employeeNo: string;
  isActive: boolean;
  managerId?: string;
  department?: { id: string; name: string };
  jobTitle?: { id: string; name: string };
}

interface Department {
  id: string;
  name: string;
}

interface OrgNode extends Employee {
  children: OrgNode[];
  level: number;
}

// Icons
const Icons = {
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  user: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  phone: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  email: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  department: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  id: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    </svg>
  ),
  zoomIn: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
    </svg>
  ),
  zoomOut: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
    </svg>
  ),
  reset: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  expand: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  collapse: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ),
};

// Color palette for different levels
const levelColors = [
  { bg: 'from-primary-500 to-primary-600', border: 'border-primary-300 dark:border-primary-700', highlight: 'ring-primary-400' },
  { bg: 'from-blue-500 to-blue-600', border: 'border-blue-300 dark:border-blue-700', highlight: 'ring-blue-400' },
  { bg: 'from-emerald-500 to-emerald-600', border: 'border-emerald-300 dark:border-emerald-700', highlight: 'ring-emerald-400' },
  { bg: 'from-amber-500 to-amber-600', border: 'border-amber-300 dark:border-amber-700', highlight: 'ring-amber-400' },
  { bg: 'from-purple-500 to-purple-600', border: 'border-purple-300 dark:border-purple-700', highlight: 'ring-purple-400' },
  { bg: 'from-rose-500 to-rose-600', border: 'border-rose-300 dark:border-rose-700', highlight: 'ring-rose-400' },
];

export default function OrgChartPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [highlightedPath, setHighlightedPath] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [empRes, deptRes] = await Promise.all([
        fetch('${API_URL}/employees?limit=500', { headers }),
        fetch('${API_URL}/departments?limit=100', { headers }),
      ]);

      const [empData, deptData] = await Promise.all([empRes.json(), deptRes.json()]);

      if (empData.success) {
        const employeeList = empData.data || [];
        setEmployees(employeeList);
        // Auto-collapse nodes at level 2+ to show only top 3 levels initially
        const nodesToCollapse = collectNodesToCollapseFromEmployees(employeeList);
        setCollapsedNodes(nodesToCollapse);
      }
      if (deptData.success) setDepartments(deptData.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to collect nodes to collapse from raw employee list (without useCallback dependency)
  const collectNodesToCollapseFromEmployees = (employees: Employee[]): Set<string> => {
    const employeeMap = new Map<string, { id: string; managerId?: string; children: string[]; level: number }>();
    const roots: string[] = [];

    // Build structure
    employees.forEach((emp) => {
      employeeMap.set(emp.id, { id: emp.id, managerId: emp.managerId, children: [], level: 0 });
    });

    employees.forEach((emp) => {
      if (emp.managerId && employeeMap.has(emp.managerId)) {
        employeeMap.get(emp.managerId)!.children.push(emp.id);
      } else {
        roots.push(emp.id);
      }
    });

    // Assign levels
    const assignLevels = (nodeId: string, level: number) => {
      const node = employeeMap.get(nodeId);
      if (node) {
        node.level = level;
        node.children.forEach((childId) => assignLevels(childId, level + 1));
      }
    };
    roots.forEach((rootId) => assignLevels(rootId, 0));

    // Collect nodes at level >= 2 with children
    const nodesToCollapse = new Set<string>();
    employeeMap.forEach((node) => {
      if (node.level >= 2 && node.children.length > 0) {
        nodesToCollapse.add(node.id);
      }
    });

    return nodesToCollapse;
  };

  // Build hierarchy tree
  const buildTree = useCallback((employees: Employee[]): OrgNode[] => {
    const employeeMap = new Map<string, OrgNode>();
    const roots: OrgNode[] = [];

    employees.forEach((emp) => {
      employeeMap.set(emp.id, { ...emp, children: [], level: 0 });
    });

    // First pass: assign levels properly by traversing from roots
    const assignLevels = (nodeId: string, level: number) => {
      const node = employeeMap.get(nodeId);
      if (node) {
        node.level = level;
        employees
          .filter((e) => e.managerId === nodeId)
          .forEach((child) => assignLevels(child.id, level + 1));
      }
    };

    employees.forEach((emp) => {
      const node = employeeMap.get(emp.id)!;
      if (emp.managerId && employeeMap.has(emp.managerId)) {
        const parent = employeeMap.get(emp.managerId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Assign proper levels starting from roots
    roots.forEach((root) => assignLevels(root.id, 0));

    const sortNodes = (nodes: OrgNode[]) => {
      nodes.sort((a, b) => {
        const aTitle = a.jobTitle?.name?.toLowerCase() || '';
        const bTitle = b.jobTitle?.name?.toLowerCase() || '';
        const aIsMgr = aTitle.includes('manager') || aTitle.includes('head') || aTitle.includes('director') || aTitle.includes('ceo') || aTitle.includes('gm');
        const bIsMgr = bTitle.includes('manager') || bTitle.includes('head') || bTitle.includes('director') || bTitle.includes('ceo') || bTitle.includes('gm');
        if (aIsMgr && !bIsMgr) return -1;
        if (!aIsMgr && bIsMgr) return 1;
        return a.firstName.localeCompare(b.firstName);
      });
      nodes.forEach((node) => sortNodes(node.children));
    };

    sortNodes(roots);
    return roots;
  }, []);

  // Expand all nodes
  const expandAll = () => {
    setCollapsedNodes(new Set());
  };

  // Collapse to show only top 3 levels
  const collapseToInitial = () => {
    const nodesToCollapse = collectNodesToCollapseFromEmployees(filteredEmployees);
    setCollapsedNodes(nodesToCollapse);
  };

  // Find path to employee
  const findPathToEmployee = useCallback((targetId: string, employees: Employee[]): Set<string> => {
    const path = new Set<string>();
    const findPath = (id: string): boolean => {
      path.add(id);
      const emp = employees.find((e) => e.id === id);
      if (!emp?.managerId) return true;
      return findPath(emp.managerId);
    };
    findPath(targetId);
    return path;
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    if (!query.trim()) {
      setHighlightedPath(new Set());
      return;
    }

    const queryLower = query.toLowerCase();
    const found = employees.find(
      (e) =>
        e.firstName.toLowerCase().includes(queryLower) ||
        e.lastName.toLowerCase().includes(queryLower) ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(queryLower) ||
        e.employeeNo.toLowerCase().includes(queryLower)
    );

    if (found) {
      const path = findPathToEmployee(found.id, employees);
      setHighlightedPath(path);
      // Expand all nodes in path
      setCollapsedNodes((prev) => {
        const next = new Set(prev);
        path.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setHighlightedPath(new Set());
    }
  }, [employees, findPathToEmployee]);

  // Toggle node collapse
  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    if (departmentFilter && emp.department?.id !== departmentFilter) return false;
    return true;
  });

  const tree = buildTree(filteredEmployees);

  // Get initials
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  // Render org node card
  const OrgCard = ({ node, isHighlighted }: { node: OrgNode; isHighlighted: boolean }) => {
    const colorSet = levelColors[Math.min(node.level, levelColors.length - 1)];
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);

    return (
      <div
        className={`relative bg-white dark:bg-dark-800 rounded-xl border-2 shadow-sm hover:shadow-lg transition-all cursor-pointer min-w-[180px] max-w-[200px] ${
          isHighlighted
            ? `${colorSet.border} ring-2 ${colorSet.highlight}`
            : 'border-dark-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-600'
        }`}
        onClick={() => setSelectedEmployee(node)}
      >
        {/* Avatar Header */}
        <div className={`bg-gradient-to-r ${colorSet.bg} rounded-t-[10px] p-3 flex items-center justify-center`}>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            {getInitials(node.firstName, node.lastName)}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 text-center">
          <h4 className="font-semibold text-dark-800 dark:text-white text-sm truncate">
            {node.firstName} {node.lastName}
          </h4>
          <p className="text-xs text-dark-500 dark:text-dark-400 truncate mt-0.5">
            {node.jobTitle?.name || 'No title'}
          </p>
          {node.department && (
            <p className="text-xs text-primary-500 dark:text-primary-400 truncate mt-0.5">
              {node.department.name}
            </p>
          )}
          {!node.isActive && (
            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              Inactive
            </span>
          )}
        </div>

        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={(e) => toggleCollapse(node.id, e)}
            className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white dark:bg-dark-700 border-2 ${colorSet.border} flex items-center justify-center text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200 shadow-sm z-10`}
          >
            {isCollapsed ? (
              <span className="text-xs font-bold">{node.children.length}</span>
            ) : (
              Icons.collapse
            )}
          </button>
        )}
      </div>
    );
  };

  // Render tree node with connectors
  const renderNode = (node: OrgNode): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);
    const isHighlighted = highlightedPath.has(node.id);

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Card */}
        <OrgCard node={node} isHighlighted={isHighlighted} />

        {/* Children */}
        {hasChildren && !isCollapsed && (
          <>
            {/* Vertical line down from parent */}
            <div className="w-px h-6 bg-dark-300 dark:bg-dark-600" />

            {/* Children container */}
            <div className="flex items-start">
              {node.children.map((child, index) => (
                <div key={child.id} className="flex flex-col items-center relative">
                  {/* Horizontal connector line */}
                  {node.children.length > 1 && (
                    <div
                      className={`absolute top-0 h-px bg-dark-300 dark:bg-dark-600 ${
                        index === 0
                          ? 'left-1/2 right-0'
                          : index === node.children.length - 1
                          ? 'left-0 right-1/2'
                          : 'left-0 right-0'
                      }`}
                      style={{ width: index === 0 || index === node.children.length - 1 ? '50%' : '100%' }}
                    />
                  )}

                  {/* Vertical line down to child */}
                  <div className="w-px h-6 bg-dark-300 dark:bg-dark-600" />

                  {/* Child node */}
                  <div className="px-2">
                    {renderNode(child)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Organization Chart</h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Employee hierarchy visualization
          </p>
        </div>
        <Link
          href="/employees"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors text-sm font-medium"
        >
          {Icons.user}
          View All Employees
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
            {Icons.search}
          </div>
          <input
            type="text"
            placeholder="Search employee by name or ID..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-modern !pl-11"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-400 hover:text-dark-600"
            >
              {Icons.x}
            </button>
          )}
        </div>

        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="input-modern min-w-[180px]"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        {/* Expand/Collapse Controls */}
        <div className="flex items-center gap-1 bg-dark-100 dark:bg-dark-800 rounded-xl p-1">
          <button
            onClick={expandAll}
            className="px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300 text-sm font-medium flex items-center gap-1.5"
            title="Expand all nodes"
          >
            {Icons.expand}
            Expand All
          </button>
          <button
            onClick={collapseToInitial}
            className="px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300 text-sm font-medium flex items-center gap-1.5"
            title="Collapse to top 3 levels"
          >
            {Icons.collapse}
            Collapse
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-dark-100 dark:bg-dark-800 rounded-xl p-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
            className="p-2 rounded-lg hover:bg-white dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300"
            title="Zoom out"
          >
            {Icons.zoomOut}
          </button>
          <span className="px-2 text-sm text-dark-600 dark:text-dark-400 min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            className="p-2 rounded-lg hover:bg-white dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300"
            title="Zoom in"
          >
            {Icons.zoomIn}
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 rounded-lg hover:bg-white dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300"
            title="Reset zoom"
          >
            {Icons.reset}
          </button>
        </div>
      </div>

      {/* Search Result Info */}
      {search && highlightedPath.size > 0 && (
        <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-4 py-2 rounded-lg">
          <span>Showing hierarchy path for search result</span>
          <button
            onClick={() => handleSearch('')}
            className="underline hover:no-underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Org Chart Container - outer wrapper constrains width */}
      <div className="w-full max-w-full">
        <div
          ref={containerRef}
          className="card-modern overflow-x-auto overflow-y-auto dark:bg-dark-800 dark:border-dark-700"
          style={{ minHeight: '500px', maxHeight: 'calc(100vh - 280px)' }}
        >
          <div className="p-8 inline-block min-w-full">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"></div>
                  <span className="text-dark-400 dark:text-dark-500 text-sm">Loading organization chart...</span>
                </div>
              </div>
            ) : tree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-16 w-16 rounded-2xl bg-dark-100 dark:bg-dark-700 flex items-center justify-center text-dark-400 mb-4">
                  {Icons.user}
                </div>
                <p className="text-dark-500 dark:text-dark-400 font-medium">No employees found</p>
                <p className="text-sm text-dark-400 dark:text-dark-500 mt-1">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div
                className="inline-flex flex-col items-center"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              >
                {/* Render all root nodes */}
                <div className="flex items-start gap-8">
                  {tree.map((rootNode) => (
                    <div key={rootNode.id} className="flex flex-col items-center">
                      {renderNode(rootNode)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-dark-500 dark:text-dark-400">
        <span className="font-medium">Hierarchy Levels:</span>
        {['CEO/Top', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5+'].map((label, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${levelColors[idx].bg}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedEmployee(null)}
          />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <button
              onClick={() => setSelectedEmployee(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500"
            >
              {Icons.x}
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${levelColors[0].bg} flex items-center justify-center text-white font-bold text-xl`}>
                {getInitials(selectedEmployee.firstName, selectedEmployee.lastName)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-dark-800 dark:text-white">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </h3>
                {(selectedEmployee.firstNameAr || selectedEmployee.lastNameAr) && (
                  <p className="text-dark-500 dark:text-dark-400 text-sm" dir="rtl">
                    {selectedEmployee.firstNameAr} {selectedEmployee.lastNameAr}
                  </p>
                )}
                <p className="text-primary-500 dark:text-primary-400 font-medium">
                  {selectedEmployee.jobTitle?.name || 'No job title'}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-dark-600 dark:text-dark-300">
                <span className="text-dark-400">{Icons.id}</span>
                <span className="font-medium">Employee ID:</span>
                <span>{selectedEmployee.employeeNo}</span>
              </div>

              {selectedEmployee.email && (
                <div className="flex items-center gap-3 text-dark-600 dark:text-dark-300">
                  <span className="text-dark-400">{Icons.email}</span>
                  <span className="font-medium">Email:</span>
                  <a href={`mailto:${selectedEmployee.email}`} className="text-primary-500 hover:underline truncate">
                    {selectedEmployee.email}
                  </a>
                </div>
              )}

              {selectedEmployee.phone && (
                <div className="flex items-center gap-3 text-dark-600 dark:text-dark-300">
                  <span className="text-dark-400">{Icons.phone}</span>
                  <span className="font-medium">Phone:</span>
                  <a href={`tel:${selectedEmployee.phone}`} className="text-primary-500 hover:underline">
                    {selectedEmployee.phone}
                  </a>
                </div>
              )}

              {selectedEmployee.department && (
                <div className="flex items-center gap-3 text-dark-600 dark:text-dark-300">
                  <span className="text-dark-400">{Icons.department}</span>
                  <span className="font-medium">Department:</span>
                  <span>{selectedEmployee.department.name}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <span className="font-medium text-dark-600 dark:text-dark-300">Status:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    selectedEmployee.isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${selectedEmployee.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {selectedEmployee.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-dark-100 dark:border-dark-700">
              <Link
                href={`/employees/${selectedEmployee.id}`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-center font-medium hover:bg-primary-600 transition-colors"
              >
                View Full Profile
              </Link>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
