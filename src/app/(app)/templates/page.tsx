import { createClient } from "@/lib/supabase/server";
import { listTemplates } from "@/lib/services/templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { UrgencyDot } from "@/components/tasks/urgency-badge";
import { TemplateFormDialog } from "@/components/templates/template-form-dialog";
import { DeleteTemplateButton } from "@/components/templates/delete-template-button";
import { LayoutTemplate } from "lucide-react";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const templates = await listTemplates(supabase);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sjablonen</h1>
          <p className="text-sm text-muted-foreground">
            Herbruikbare taaklijsten om snel een nieuw project op te starten.
          </p>
        </div>
        <TemplateFormDialog trigger={<Button>Nieuw sjabloon</Button>} />
      </div>

      <div className="mt-6">
        {templates.length === 0 ? (
          <EmptyState
            icon={LayoutTemplate}
            title="Nog geen sjablonen"
            description="Maak een sjabloon aan met vaste taken, bijvoorbeeld voor een nieuwe-klant-checklist."
            action={<TemplateFormDialog trigger={<Button>Nieuw sjabloon</Button>} />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium leading-tight">{template.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {template.tasks.length}{" "}
                      {template.tasks.length === 1 ? "taak" : "taken"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <TemplateFormDialog
                      template={template}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Bewerken
                        </Button>
                      }
                    />
                    <DeleteTemplateButton
                      templateId={template.id}
                      templateName={template.name}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-1.5">
                    {template.tasks.slice(0, 6).map((task, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <UrgencyDot urgency={task.urgency ?? "normal"} />
                        <span className="truncate">{task.title}</span>
                      </li>
                    ))}
                    {template.tasks.length > 6 && (
                      <li className="text-xs text-muted-foreground">
                        + {template.tasks.length - 6} meer
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
