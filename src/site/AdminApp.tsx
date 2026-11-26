import { ThemeProvider } from "@/components/ThemeProvider";
import { ConsentProvider } from "@/lib/consent";
import { GoogleLivePlaceProvider } from "@/lib/googlePlaceLive";
import { QuickRequestProvider } from "@/components/QuickRequestSheet";
import AdminPage from "@/app/admin/page";

export default function AdminApp() {
  return (
    <GoogleLivePlaceProvider>
      <ConsentProvider>
        <ThemeProvider>
          <QuickRequestProvider>
            <main className="min-h-screen bg-surface text-primary dark:bg-slate-950 dark:text-slate-100">
              <AdminPage />
            </main>
          </QuickRequestProvider>
        </ThemeProvider>
      </ConsentProvider>
    </GoogleLivePlaceProvider>
  );
}
