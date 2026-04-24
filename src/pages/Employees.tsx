import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useERPContext } from '@/context/ERPContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Employee } from '@/types/erp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, MoreHorizontal, Trash2, UserCheck, UserX } from 'lucide-react';

const departments = ['Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Support', 'Other'];

export default function Employees() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useERPContext();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '', department: '', joinDate: new Date().toISOString().split('T')[0], salary: '' });

  const handleAdd = () => {
    const employee: Employee = {
      id: crypto.randomUUID(),
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      role: form.role,
      department: form.department,
      joinDate: form.joinDate,
      salary: form.salary ? parseFloat(form.salary) : undefined,
      status: 'active',
    };
    addEmployee(employee);
    setAddOpen(false);
    setForm({ name: '', email: '', phone: '', role: '', department: '', joinDate: new Date().toISOString().split('T')[0], salary: '' });
  };

  const { formatCurrency } = useCurrency();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Employees</h1>
            <p className="mt-1 text-muted-foreground">Manage employee records, roles, and departments.</p>
          </div>
          <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Employee</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{employees.length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-success">{employees.filter(e => e.status === 'active').length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{new Set(employees.map(e => e.department)).size}</p></CardContent></Card>
        </div>

        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-lg font-semibold">No employees yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first employee.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.role}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{e.department}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{e.email}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(e.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        e.status === 'active' ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'
                      }`}>{e.status === 'active' ? 'Active' : 'Inactive'}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {e.status === 'active' ? (
                            <DropdownMenuItem onClick={() => updateEmployee(e.id, { status: 'inactive' })}><UserX className="mr-2 h-4 w-4" /> Deactivate</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => updateEmployee(e.id, { status: 'active' })}><UserCheck className="mr-2 h-4 w-4" /> Activate</DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteEmployee(e.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Role</Label><Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g., Manager" /></div>
              <div>
                <Label>Department</Label>
                <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Join Date</Label><Input type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} /></div>
            </div>
            <div><Label>Salary</Label><Input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="Optional" /></div>
          </div>
          <DialogFooter><Button onClick={handleAdd} disabled={!form.name || !form.email || !form.role}>Add Employee</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
