import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { InvoiceFilters } from '@/components/invoices/InvoiceFilters';
import { UploadInvoiceDialog } from '@/components/invoices/UploadInvoiceDialog';
import { RecommendationPanel } from '@/components/invoices/RecommendationPanel';
import { useInvoiceContext } from '@/context/InvoiceContext';
import { InvoiceStatus } from '@/types/invoice';
import { useSearchParams } from 'react-router-dom';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Invoices() {
  const { invoices, addInvoice, updateInvoiceStatus, deleteInvoice } = useInvoiceContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Pre-fill search from query params (client or vendor)
  useEffect(() => {
    const client = searchParams.get('client');
    const vendor = searchParams.get('vendor');
    if (client) {
      setSearchTerm(client);
      setSearchParams({}, { replace: true });
    } else if (vendor) {
      setSearchTerm(vendor);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(term) ||
        invoice.clientName.toLowerCase().includes(term) ||
        invoice.clientEmail.toLowerCase().includes(term) ||
        (invoice.vendorName?.toLowerCase().includes(term) ?? false);
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, invoices]);

  const totalPages = Math.ceil(filteredInvoices.length / pageSize);
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (val: string) => { setSearchTerm(val); setCurrentPage(1); };
  const handleStatusChange = (val: InvoiceStatus | 'all') => { setStatusFilter(val); setCurrentPage(1); };
  const handlePageSizeChange = (val: string) => { setPageSize(Number(val)); setCurrentPage(1); };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Invoices</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track all your invoices in one place.
          </p>
        </div>

        <InvoiceFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          onNewInvoice={() => setUploadOpen(true)}
        />

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-semibold text-foreground">No invoices yet</p>
            <p className="text-sm text-muted-foreground mt-1">Upload your first invoice to get started.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredInvoices.length)} of {filteredInvoices.length} invoices
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per page:</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[72px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 25, 50, 100].map(size => (
                      <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <InvoiceTable invoices={paginatedInvoices} onDelete={deleteInvoice} onStatusChange={updateInvoiceStatus} />

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (totalPages <= 7 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    if (page === 2 && currentPage > 4) return <PaginationEllipsis key="start-ellipsis" />;
                    if (page === totalPages - 1 && currentPage < totalPages - 3) return <PaginationEllipsis key="end-ellipsis" />;
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}

            <RecommendationPanel />
          </>
        )}

        <UploadInvoiceDialog
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onSave={addInvoice}
        />
      </div>
    </MainLayout>
  );
}
