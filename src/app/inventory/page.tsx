// src/app/inventory/page.tsx
import ClientLayout from "@/components/ClientLayout";
import Inventory from "@/components/Inventory";
import type { NextPage } from 'next';

const HistoryPage: NextPage = () => {
  return (
    // We wrap the Inventory component with ClientLayout to maintain the sidebar and header
    <ClientLayout>
      <Inventory />
    </ClientLayout>
  );
}

export default HistoryPage;
