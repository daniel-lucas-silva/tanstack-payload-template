import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  Sparkles,
  Layers,
  Sliders,
  CheckCircle2,
  Bell,
  Heart,
  Share2,
  Plus,
  Send,
  Trash2,
  Search,
} from 'lucide-react';
import { AppShell } from '@/components/app/app-shell';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  Avatar,
  Avatarish,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  Skeleton,
  Separator,
  Stars,
  Indicacoes,
  Verificado,
  StatusBadge,
  SectionTitle,
} from '@/components/ui';

export const Route = createFileRoute('/components')({
  component: ComponentsShowcasePage,
});

function ComponentsShowcasePage() {
  const [activeTab, setActiveTab] = React.useState('primitives');
  const [inputText, setInputText] = React.useState('');
  const [likes, setLikes] = React.useState(24);
  const [isLiked, setIsLiked] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const toggleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  return (
    <AppShell title="UI Kit Mobile & Tailwind" maxWidth="lg">
      <div className="space-y-6">
        {/* Header Intro */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="info" className="gap-1">
              <Sparkles className="h-3 w-3" /> Tailwind v4 + Base UI
            </Badge>
            <Verificado compact />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Componentes Mobile & UI</h1>
          <p className="text-xs text-muted-foreground">
            Biblioteca de componentes atômicos e layouts mobile-first estilizados com Tailwind CSS puro, CVA e TanStack Router.
          </p>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="primitives">Primitivos</TabsTrigger>
            <TabsTrigger value="forms">Inputs & Forms</TabsTrigger>
            <TabsTrigger value="modals">Overlays & Cards</TabsTrigger>
          </TabsList>

          {/* TAB 1: Primitives */}
          <TabsContent value="primitives" className="space-y-5 pt-2">
            {/* Buttons Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" /> Botões & Variantes
                </CardTitle>
                <CardDescription>
                  Touch targets de 44px+, estados de foco com ring e animações de clique.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="default">Default Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link Button</Button>
                </div>

                <Separator />

                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon" variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="icon-sm" variant="secondary">
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Badges & Status Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Badges, Micro-Bits & Tags</CardTitle>
                <CardDescription>Indicadores de status com contraste e legibilidade acessível.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Sucesso</Badge>
                  <Badge variant="warning">Atenção</Badge>
                  <Badge variant="destructive">Erro</Badge>
                  <Badge variant="info">Informativo</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <Stars nota={4.8} avaliacoes={142} />
                  <Indicacoes total={likes} />
                  <Verificado />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <StatusBadge tone="sucesso">Ativo</StatusBadge>
                  <StatusBadge tone="alerta">Pendente</StatusBadge>
                  <StatusBadge tone="perigo">Cancelado</StatusBadge>
                  <StatusBadge tone="accent">Em análise</StatusBadge>
                </div>
              </CardContent>
            </Card>

            {/* Avatars & Skeletons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avatares & Skeletons</CardTitle>
                <CardDescription>Carregamento progressivo e representações visuais de usuário.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatarish nome="Carlos Silva" />
                  <Avatarish nome="Mariana Souza" />
                  <Avatar fallback="PL" />
                  <div>
                    <p className="text-xs font-semibold">Mariana Souza</p>
                    <p className="text-[11px] text-muted-foreground">mariana@exemplo.com</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-[11px] text-muted-foreground">Estados de Skeleton Loader:</p>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Forms & Inputs */}
          <TabsContent value="forms" className="space-y-5 pt-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Campos de Entrada & Formulários</CardTitle>
                <CardDescription>Controles de digitação com feedback de foco e validação integrada.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Campo Padrão</label>
                  <Input
                    placeholder="Digite seu nome ou título..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Busca com Ícone</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar itens, posts ou categorias..." className="pl-9" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Campo com Erro de Validação</label>
                  <Input placeholder="email@invalido" defaultValue="teste@" error="Por favor insira um email válido" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Área de Texto (Textarea)</label>
                  <Textarea placeholder="Escreva observações ou detalhes adicionais..." rows={3} />
                </div>
              </CardContent>
              <CardFooter className="justify-between border-t border-border pt-4">
                <Button variant="ghost" size="sm" onClick={() => setInputText('')}>
                  Limpar
                </Button>
                <Button size="sm" className="gap-1.5">
                  <Send className="h-3.5 w-3.5" /> Enviar Dados
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* TAB 3: Overlays & Modals */}
          <TabsContent value="modals" className="space-y-5 pt-2">
            {/* Mobile Bottom Sheet (Drawer) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Drawer / Bottom Sheet Mobile</CardTitle>
                <CardDescription>
                  Padrão clássico de interface para smartphones para confirmações e filtros rápidos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <DrawerTrigger className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
                    Abrir Bottom Sheet Mobile
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Opções Rápidas do Item</DrawerTitle>
                      <DrawerDescription>Selecione a ação desejada para este registro.</DrawerDescription>
                    </DrawerHeader>
                    <div className="space-y-2 py-2">
                      <Button
                        variant="secondary"
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          toggleLike();
                          setDrawerOpen(false);
                        }}
                      >
                        <Heart className="h-4 w-4 text-rose-500" />
                        {isLiked ? 'Remover Indicação' : 'Indicar este item'} ({likes})
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => setDrawerOpen(false)}
                      >
                        <Share2 className="h-4 w-4 text-indigo-400" /> Compartilhar Link
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full justify-start gap-2"
                        onClick={() => setDrawerOpen(false)}
                      >
                        <Trash2 className="h-4 w-4" /> Excluir Registro
                      </Button>
                    </div>
                    <DrawerFooter>
                      <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
                        Fechar
                      </Button>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </CardContent>
            </Card>

            {/* Modal Dialog */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dialog / Modal Central</CardTitle>
                <CardDescription>Janela modal com backdrop blur e acessibilidade via teclado.</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors cursor-pointer">
                    Abrir Modal Dialog
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar Operação</DialogTitle>
                      <DialogDescription>
                        Esta ação atualiza o estado local e dispara a sincronização em background.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-3 text-xs text-muted-foreground space-y-2">
                      <p>Você está prestes a aplicar as novas definições de interface ao projeto.</p>
                      <div className="rounded-lg bg-secondary/60 p-3 border border-border">
                        <p className="font-medium text-foreground">Resumo das configurações:</p>
                        <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px]">
                          <li>Tailwind CSS v4 inline themes</li>
                          <li>Design tokens consistentes</li>
                          <li>Navegação mobile por abas</li>
                        </ul>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setDialogOpen(false);
                        }}
                      >
                        Confirmar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Interactive Mobile Card Demo */}
            <Card>
              <CardHeader className="pb-3">
                <SectionTitle
                  action={
                    <button
                      type="button"
                      onClick={toggleLike}
                      className="text-muted-foreground hover:text-rose-500 transition-colors p-1"
                    >
                      <Heart
                        className={`h-4 w-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                      />
                    </button>
                  }
                >
                  Card de Demonstração Mobile
                </SectionTitle>
                <div className="flex items-center gap-2">
                  <Stars nota={4.9} avaliacoes={88} />
                  <span className="text-muted-foreground">·</span>
                  <Indicacoes total={likes} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Card otimizado com padding proporcional, tipografia contrastante e cantos calculados.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="secondary">Mobile First</Badge>
                  <Badge variant="outline">Responsivo</Badge>
                  <Badge variant="success">Zero Delay</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
