import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Pagina non trovata</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            La pagina che stai cercando non esiste o non è disponibile.
          </p>

          <a href="/" className="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-800">
            Torna alla home
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
