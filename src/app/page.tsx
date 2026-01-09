// src/app/page.tsx
import ClientLayout from "@/components/ClientLayout";
import Inventory from "@/components/Inventory";

import type { NextPage } from 'next';

const Home: NextPage = () => {
  return (
    <ClientLayout>
      <Inventory />
      {/* <History /> */}
    </ClientLayout>
  );
}
export default Home;

