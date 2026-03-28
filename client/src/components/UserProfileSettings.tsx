
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Key, MessageCircle } from 'lucide-react';

export default function UserProfileSettings() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApiKey(data.googleSheetsApiKey || '');
        setTelegramBotToken(data.telegramBotToken || '');
        setTelegramChatId(data.telegramChatId || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveApiKey = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/google-sheets-api-key', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey })
      });

      if (response.ok) {
        toast({
          title: "API Key salvata",
          description: "La tua Google Sheets API Key è stata aggiornata con successo."
        });
      } else {
        throw new Error('Failed to save API Key');
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare l'API Key",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTelegramConfig = async () => {
    setTelegramLoading(true);
    try {
      const response = await fetch('/api/auth/telegram-config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          botToken: telegramBotToken, 
          chatId: telegramChatId 
        })
      });

      if (response.ok) {
        toast({
          title: "Configurazione Telegram salvata",
          description: "Il tuo bot Telegram è stato configurato con successo."
        });
      } else {
        throw new Error('Failed to save Telegram config');
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare la configurazione Telegram",
        variant: "destructive"
      });
    } finally {
      setTelegramLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-indigo-600" />
            Google Sheets API Key
          </CardTitle>
          <CardDescription>
            Configura la tua API Key personale per la sincronizzazione con Google Sheets
          </CardDescription>
        </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-slate-600">
            Ottieni la tua API Key dalla{' '}
            <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Cloud Console
            </a>
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={saveApiKey} disabled={loading || !apiKey} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {loading ? "Salvataggio..." : "Salva API Key"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowGuide(!showGuide)}
          >
            {showGuide ? "Nascondi Guida" : "Guida Setup"}
          </Button>
        </div>

        {showGuide && (
          <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
            <h4 className="font-semibold text-sm text-slate-800">Guida Step-by-Step: Come ottenere la tua Google Sheets API Key</h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="font-bold text-primary">1.</span>
                <div>
                  <p className="font-medium">Vai alla Google Cloud Console</p>
                  <p className="text-slate-600">
                    Apri{' '}
                    <a 
                      href="https://console.cloud.google.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      console.cloud.google.com
                    </a>
                    {' '}e accedi con il tuo account Google
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="font-bold text-primary">2.</span>
                <div>
                  <p className="font-medium">Crea un nuovo progetto (se necessario)</p>
                  <p className="text-slate-600">
                    Clicca sul menu a tendina del progetto in alto e seleziona "Nuovo progetto"
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="font-bold text-primary">3.</span>
                <div>
                  <p className="font-medium">Abilita l'API di Google Sheets</p>
                  <p className="text-slate-600">
                    Vai su "API e servizi" → "Libreria" → Cerca "Google Sheets API" → Clicca "Abilita"
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="font-bold text-primary">4.</span>
                <div>
                  <p className="font-medium">Crea le credenziali API Key</p>
                  <p className="text-slate-600">
                    Vai su "API e servizi" → "Credenziali" → "Crea credenziali" → "Chiave API"
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="font-bold text-primary">5.</span>
                <div>
                  <p className="font-medium">Configura le restrizioni (opzionale ma consigliato)</p>
                  <p className="text-slate-600">
                    Clicca sulla chiave appena creata → "Restrizioni applicazione" → Scegli "Restrizioni API" → 
                    Seleziona solo "Google Sheets API"
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="font-bold text-primary">6.</span>
                <div>
                  <p className="font-medium">Copia e incolla l'API Key</p>
                  <p className="text-slate-600">
                    Copia la chiave API generata e incollala nel campo qui sopra, quindi clicca "Salva API Key"
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="font-bold text-primary">7.</span>
                <div>
                  <p className="font-medium">Condividi i tuoi Google Sheets</p>
                  <p className="text-slate-600">
                    Assicurati che i fogli Google che vuoi sincronizzare siano condivisi pubblicamente 
                    (in sola lettura) o con "Chiunque abbia il link può visualizzare"
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>Importante:</strong> Conserva la tua API Key in modo sicuro. 
                Questa chiave è personale e consente l'accesso ai tuoi Google Sheets. 
                Non condividerla con nessuno.
              </p>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>Suggerimento:</strong> Se hai problemi con l'API Key, verifica che:
                <br />• L'API di Google Sheets sia abilitata nel tuo progetto
                <br />• I fogli Google siano condivisi correttamente
                <br />• Non ci siano restrizioni IP sulla chiave API
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-indigo-600" />
            Notifiche Telegram
          </CardTitle>
          <CardDescription>
            Configura il tuo bot Telegram per ricevere notifiche di nuovi lead
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="telegram-token">Bot Token</Label>
            <div className="relative">
              <Input
                id="telegram-token"
                type={showTelegramToken ? "text" : "password"}
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowTelegramToken(!showTelegramToken)}
              >
                {showTelegramToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram-chat-id">Chat ID</Label>
            <Input
              id="telegram-chat-id"
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="123456789"
            />
            <p className="text-xs text-slate-600">
              Il tuo ID personale Telegram dove riceverai le notifiche
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={saveTelegramConfig} 
              disabled={telegramLoading || !telegramBotToken || !telegramChatId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {telegramLoading ? "Salvataggio..." : "Salva Configurazione"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowTelegramGuide(!showTelegramGuide)}
            >
              {showTelegramGuide ? "Nascondi Guida" : "Guida Setup"}
            </Button>
          </div>

          {showTelegramGuide && (
            <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
              <h4 className="font-semibold text-sm text-slate-800">Guida Step-by-Step: Come configurare il Bot Telegram</h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <div>
                    <p className="font-medium">Crea un nuovo Bot Telegram</p>
                    <p className="text-slate-600">
                      Apri Telegram e cerca <code className="px-1 py-0.5 bg-slate-100 rounded">@BotFather</code>.
                      Invia il comando <code className="px-1 py-0.5 bg-slate-100 rounded">/newbot</code> e segui le istruzioni
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <div>
                    <p className="font-medium">Copia il Token del Bot</p>
                    <p className="text-slate-600">
                      BotFather ti darà un token tipo <code className="px-1 py-0.5 bg-slate-100 rounded">123456789:ABCdefGHI...</code>. 
                      Copialo e incollalo nel campo "Bot Token" qui sopra
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-primary">3.</span>
                  <div>
                    <p className="font-medium">Ottieni il tuo Chat ID</p>
                    <p className="text-slate-600">
                      • Cerca <code className="px-1 py-0.5 bg-slate-100 rounded">@userinfobot</code> su Telegram<br />
                      • Invia il comando <code className="px-1 py-0.5 bg-slate-100 rounded">/start</code><br />
                      • Il bot ti risponderà con il tuo Chat ID (es. 123456789)
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-primary">4.</span>
                  <div>
                    <p className="font-medium">Avvia il Bot</p>
                    <p className="text-slate-600">
                      Cerca il tuo bot su Telegram (il nome che hai scelto al punto 1) e clicca "START" 
                      per attivare la ricezione dei messaggi
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-primary">5.</span>
                  <div>
                    <p className="font-medium">Salva e testa</p>
                    <p className="text-slate-600">
                      Clicca "Salva Configurazione" qui sopra. Al prossimo lead importato da Google Sheets, 
                      riceverai una notifica Telegram automatica!
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Importante:</strong> Conserva il Bot Token in modo sicuro. 
                  Non condividerlo mai con nessuno. Chiunque abbia il token può inviare messaggi tramite il tuo bot.
                </p>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 <strong>Cosa riceverai:</strong> Ogni volta che un nuovo lead viene importato da Google Sheets, 
                  riceverai un messaggio Telegram con: nome, email, telefono, campagna e timestamp.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
