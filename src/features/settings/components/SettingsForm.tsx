"use client";

import { useEffect, useState } from "react";
import type { Settings } from "@/services/settings/settings-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import revalidateData from "@/data/settings/revalidate.json";
import { useAuth } from "@/contexts/auth-context";
import { PerfilUsuario } from "@/services/auth/auth-service";
import { Link, XCircle, CheckCircle, Info } from "lucide-react";
import { useSettingsContext } from "@/contexts/settings-context";

export function SettingsForm() {
  const { user } = useAuth()
  const { settings, loading, updateSetting } = useSettingsContext()
  const [editingSettings, setEditingSettings] = useState<Settings | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSetting, setSelectedSetting] = useState<{ key: string; value: any; description: string } | null>(null)
  const [dynamicRevalidateOrigin, setDynamicRevalidateOrigin] = useState<string | null>(null)

  const canEdit = user?.perfil === PerfilUsuario.Admin || user?.perfil === PerfilUsuario.Secretaria

  useEffect(() => {
    setEditingSettings(settings)
  }, [settings])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDynamicRevalidateOrigin(window.location.origin.replace(/\/$/, ""))
    }
  }, [])

  const handleInputChange = (key: string, value: string) => {
    if (editingSettings) {
      setEditingSettings({ ...editingSettings, [key]: value })
    }
  }

  const handleSwitchChange = (key: string, checked: boolean, description: string) => {
    if (editingSettings) {
      setEditingSettings({ ...editingSettings, [key]: checked })
    }
    setSelectedSetting({ key, value: checked, description })
    setDialogOpen(true)
  }

  const handleConfirmSave = async () => {
    if (selectedSetting) {
      try {
        await updateSetting(selectedSetting.key, selectedSetting.value)
        toast.success("Configuração salva com sucesso!", { icon: <CheckCircle className="h-4 w-4 text-blue-500" /> });
      } catch (error) {
        toast.error("Erro ao salvar a configuração.", { icon: <XCircle className="h-4 w-4 text-red-500" /> });
        console.error(error);
      } finally {
        setDialogOpen(false);
        setSelectedSetting(null);
      }
    }
  };

  const handleSave = async (key: string, value: any) => {
    try {
      await updateSetting(key, value)
      toast.success("Configuração salva com sucesso!", { icon: <CheckCircle className="h-4 w-4 text-blue-500" /> })
    } catch (error) {
      toast.error("Erro ao salvar a configuração.", { icon: <XCircle className="h-4 w-4 text-red-500" /> })
      console.error(error)
    }
  }

  const handleRevalidate = async (url: string) => {
    if (!url) {
      toast.error("URL de revalidação não encontrada.", { icon: <XCircle className="h-4 w-4 text-red-500" /> });
      return;
    }

    try {
      const response = await fetch(`/api/revalidate-proxy?url=${encodeURIComponent(url)}`);
      let data: unknown = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (response.ok) {
        const body = data as { message?: string } | null;
        const info = body?.message ? ` – ${body.message}` : "";
        toast.success(
          <span className="text-sm italic text-muted-foreground">
            Cache limpo com sucesso{info}
          </span>,
          { icon: <CheckCircle className="h-4 w-4 text-blue-500" /> },
        );
      } else {
        const body = (data ?? {}) as { error?: string; cause?: string };
        const message = body.error ?? "Falha ao revalidar o cache.";
        const cause = body.cause ? ` (motivo: ${body.cause})` : "";
        throw new Error(`${message}${cause}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido ao revalidar.";
      toast.error("Falha ao esvaziar o cache!", {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
      });
      console.error("Revalidate UI error:", message, error);
    }
  };

  const siteUrlValue = editingSettings?.url_site ?? "https://site.fafih.com.br"

  const revalidateEntries = dynamicRevalidateOrigin
    ? [
        {
          name: `Servidor atual (${dynamicRevalidateOrigin})`,
          url: `${dynamicRevalidateOrigin}/revalidate`,
        },
        ...revalidateData.filter((entry) => entry.url !== `${dynamicRevalidateOrigin}/revalidate`),
      ]
    : revalidateData

  if (loading || !editingSettings) {
    return <div>Carregando...</div>;
  }


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Site</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome_site">Nome do Site</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="nome_site"
                  value={editingSettings.nome_site ?? ""}
                  onChange={(e) =>
                    handleInputChange("nome_site", e.target.value)
                  }
                  disabled={!canEdit}
                />
                {canEdit && (
                  <Button onClick={() => handleSave("nome_site", editingSettings.nome_site)}>
                    Salvar
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url_site">URL do site</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="url_site"
                  value={siteUrlValue}
                  onChange={(e) => handleInputChange("url_site", e.target.value)}
                  disabled={!canEdit}
                  placeholder="https://site.fafih.com.br"
                />
                {canEdit && (
                  <Button onClick={() => handleSave("url_site", siteUrlValue)}>
                    Salvar
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_ouvidoria">E-mail da Ouvidoria</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="email_ouvidoria"
                  type="email"
                  value={editingSettings.email_ouvidoria ?? ""}
                  onChange={(e) => handleInputChange("email_ouvidoria", e.target.value)}
                  disabled={!canEdit}
                  placeholder="ouvidoria@fafih.edu.br"
                />
                {canEdit && (
                  <Button onClick={() => handleSave("email_ouvidoria", editingSettings.email_ouvidoria)}>
                    Salvar
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manutencao">Modo de Manutenção</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="manutencao"
                  checked={editingSettings.manutencao}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("manutencao", checked, "Ativar modo de manutenção")
                  }
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="drmsocial">DRM Social</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="drmsocial"
                  checked={editingSettings.drmsocial}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("drmsocial", checked, "Ativar DRM Social")
                  }
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="log_ativo">Logs do sistema</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="log_ativo"
                  checked={Boolean(editingSettings.log_ativo)}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("log_ativo", checked, "Ativar coleta de logs")
                  }
                  disabled={!canEdit}
                />
              </div>
            </div>
          <div className="border-t pt-6 space-y-4">
            {revalidateEntries.map((revalidate) => (
                <div key={revalidate.name} className="flex items-center space-x-2 border-l-2 border-green-500 pl-2">
                    <Link className="h-4 w-4" />
                    <Label>{revalidate.name}</Label>
                    <Button onClick={() => handleRevalidate(revalidate.url)} variant="outline" disabled={!canEdit}>
                        Revalidar Cache
                    </Button>
                </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Alteração</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja alterar a configuração "{selectedSetting?.description}" para "{selectedSetting?.value.toString()}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSave}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
