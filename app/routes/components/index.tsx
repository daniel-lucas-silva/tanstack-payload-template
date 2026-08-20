import * as React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
  Input,
  Textarea,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
  Switch,
  Checkbox,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Item,
  ItemGroup,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
  Skeleton,
  Separator,
} from '@/components/ui';
import {
  AppShell,
  BottomTabs,
  TopNav,
  ActionRow,
  AvatarBadge,
  StarRating,
  VerifiedBadge,
  FavoriteButton,
} from '@/components/app';
import {
  Layers,
  Sparkles,
  Smartphone,
  Search,
  SlidersHorizontal,
  Home,
  Compass,
  Bell,
  User,
  CheckCircle2,
  Package,
  ArrowRight,
  ShieldCheck,
  Send,
  Eye,
  Settings,
} from 'lucide-react';

export const Route = createFileRoute('/components/')({
  component: ComponentsShowcasePage,
});

function ComponentsShowcasePage() {
  const [activeTab, setActiveTab] = React.useState('primitives');
  const [mobileActiveTab, setMobileActiveTab] = React.useState('home');
  const [isFavorited, setIsFavorited] = React.useState(false);
  const [searchVal, setSearchVal] = React.useState('');
  const [switchChecked, setSwitchChecked] = React.useState(true);
  const [checkboxChecked, setCheckboxChecked] = React.useState(true);

  const bottomNavItems = [
    { id: 'home', label: 'Início', icon: <Home className="h-5 w-5" /> },
    { id: 'explore', label: 'Explorar', icon: <Compass className="h-5 w-5" /> },
    { id: 'notifications', label: 'Avisos', icon: <Bell className="h-5 w-5" />, badge: 3 },
    { id: 'profile', label: 'Perfil', icon: <User className="h-5 w-5" /> },
  ];

  return (
    <AppShell
      header={
        <TopNav
          title="UI Kit & Componentes Genéricos"
          subtitle="Padrão de Composição para Root App e Layers"
          leftAction={
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
            >
              ← Voltar ao Início
            </Link>
          }
          rightAction={
            <Badge variant="secondary" className="font-mono text-[10px]">
              v1.0 Generic UI
            </Badge>
          }
        />
      }
      bottomNav={
        <BottomTabs
          items={bottomNavItems}
          activeId={mobileActiveTab}
          onSelect={(id) => setMobileActiveTab(id)}
        />
      }
      maxWidth="xl"
      className="p-4 sm:p-6 space-y-8"
    >
      {/* Intro Banner */}
      <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-background to-accent/5 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Layers className="h-3.5 w-3.5" />
              Design System Componível
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Biblioteca de Componentes Genéricos
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Arquitetura baseada em composição (compound components, <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">data-slot</code> e Tailwind v4), pronta para reuso no app root e em todos os <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">layers/</code>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger render={<Button variant="default" size="sm" />}>
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Modal Exemplo
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Diálogo Genérico Componível</DialogTitle>
                  <DialogDescription>
                    Este modal utiliza primitivos de acessibilidade, backdrop blur, e foco retido.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <Field>
                    <FieldLabel>Nome do Projeto / Layer</FieldLabel>
                    <Input placeholder="Ex: Meu Remix Marketplace" defaultValue="Layer Kiosk" />
                    <FieldDescription>Identificador da camada que consome o kit de componentes.</FieldDescription>
                  </Field>
                </div>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" size="sm">Cancelar</Button>} />
                  <DialogClose render={<Button variant="default" size="sm">Salvar Alterações</Button>} />
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Drawer>
              <DrawerTrigger render={<Button variant="outline" size="sm" />}>
                <Smartphone className="h-3.5 w-3.5 mr-1" />
                Bottom Sheet
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Bottom Sheet Mobile</DrawerTitle>
                  <DrawerDescription>
                    Drawer otimizado para interação por toque com safe-area e fechamento por gesto.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="p-4 space-y-3">
                  <ActionRow
                    icon={<ShieldCheck className="h-5 w-5" />}
                    title="Segurança e Permissões"
                    subtitle="Configurações de controle de acesso (RBAC)"
                    badge={<Badge variant="secondary">Ativo</Badge>}
                  />
                  <ActionRow
                    icon={<Settings className="h-5 w-5" />}
                    title="Preferências Globais"
                    subtitle="Temas, animações e layout mobile"
                  />
                </div>
                <DrawerFooter>
                  <DrawerClose render={<Button variant="default" className="w-full">Fechar Sheet</Button>} />
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>

      {/* Main Tabs Showcase */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="primitives">Primitivos & Ações</TabsTrigger>
          <TabsTrigger value="forms">Campos & Formulários</TabsTrigger>
          <TabsTrigger value="composition">Cards & Listas</TabsTrigger>
          <TabsTrigger value="mobile">Layout Mobile & Shell</TabsTrigger>
        </TabsList>

        {/* Tab 1: Primitives */}
        <TabsContent value="primitives" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Botões & Variantes CVA</CardTitle>
                <CardDescription>Estilos semânticos com suporte a ícones inline e estados de toque.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="xs">Extra Small</Button>
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Badges & Status */}
            <Card>
              <CardHeader>
                <CardTitle>Badges & Chips de Status</CardTitle>
                <CardDescription>Tags semânticas para contadores, metadados e categorias.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="ghost">Ghost</Badge>
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-3">
                  <VerifiedBadge verified={true} />
                  <VerifiedBadge verified={false} />
                  <StarRating rating={4.8} />
                  <FavoriteButton
                    isFavorite={isFavorited}
                    onToggle={() => setIsFavorited(!isFavorited)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Forms & Inputs */}
        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Composição de Formulários (<code className="text-xs bg-muted px-1 rounded font-mono">Field</code> + <code className="text-xs bg-muted px-1 rounded font-mono">InputGroup</code>)</CardTitle>
              <CardDescription>Estrutura atômica para rótulos, add-ons, botões de ação e validações.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldGroup className="space-y-4">
                <Field>
                  <FieldLabel>Barra de Pesquisa com Addon & Ação</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <Search className="h-4 w-4" />
                    </InputGroupAddon>
                    <Input
                      placeholder="Pesquise em qualquer camada..."
                      value={searchVal}
                      onChange={(e) => setSearchVal(e.target.value)}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        variant="ghost"
                        size="xs"
                        onClick={() => alert(`Buscando: ${searchVal || 'todos'}`)}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>Busca rápida em catálogo de serviços e registros.</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel>Mensagem / Observação</FieldLabel>
                  <InputGroup>
                    <Textarea placeholder="Digite sua mensagem detalhada..." rows={3} />
                    <InputGroupAddon align="block-end" className="justify-between">
                      <span className="text-xs text-muted-foreground">Suporta Markdown</span>
                      <Button size="xs" variant="default">
                        <Send className="h-3 w-3 mr-1" />
                        Enviar
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              </FieldGroup>

              <div className="space-y-5 rounded-xl border border-border/70 bg-muted/20 p-4">
                <h4 className="text-sm font-semibold text-foreground">Controles Booleanos</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium text-foreground">Notificações Push / PWA</span>
                    <p className="text-xs text-muted-foreground">Alertas de atualizações em tempo real</p>
                  </div>
                  <Switch
                    checked={switchChecked}
                    onCheckedChange={(c) => setSwitchChecked(Boolean(c))}
                  />
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="terms-check"
                    checked={checkboxChecked}
                    onCheckedChange={(c) => setCheckboxChecked(Boolean(c))}
                  />
                  <label htmlFor="terms-check" className="text-sm font-medium leading-none cursor-pointer">
                    Concordo com os termos do sistema e compartilhamento de camadas
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Composition (Cards & Lists) */}
        <TabsContent value="composition" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Composition */}
            <Card>
              <CardHeader>
                <CardTitle>Composição de Card</CardTitle>
                <CardDescription>Padrão estruturado com <code className="text-xs bg-muted px-1 rounded font-mono">CardHeader</code>, <code className="text-xs bg-muted px-1 rounded font-mono">CardAction</code> e <code className="text-xs bg-muted px-1 rounded font-mono">CardFooter</code>.</CardDescription>
                <CardAction>
                  <Badge variant="outline">Ativo</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <AvatarBadge name="Daniel Lucas" color="#4f46e5" online={true} size={42} />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Daniel Lucas</h4>
                    <p className="text-xs text-muted-foreground">Arquiteto Fullstack • Payload CMS</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Estrutura pronta para ser consumida em qualquer endpoint REST do SDK ou componente reativo de store.
                </p>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground font-mono">ID: usr_892a</span>
                <Button size="sm" variant="default">
                  Ver Detalhes
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardFooter>
            </Card>

            {/* Item & ItemGroup Composition */}
            <Card>
              <CardHeader>
                <CardTitle>Listas Genéricas (<code className="text-xs bg-muted px-1 rounded font-mono">Item</code> & <code className="text-xs bg-muted px-1 rounded font-mono">ItemGroup</code>)</CardTitle>
                <CardDescription>Item padrão para feeds, catálogos, agendamentos e transações.</CardDescription>
              </CardHeader>
              <CardContent>
                <ItemGroup>
                  <Item variant="muted" size="sm">
                    <ItemMedia variant="icon">
                      <Package className="h-4 w-4 text-primary" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>Camada Kiosk Ativa</ItemTitle>
                      <ItemDescription>Sincronizado via Service Worker e offline cache.</ItemDescription>
                    </ItemContent>
                    <Badge variant="secondary">Online</Badge>
                  </Item>
                  <Item variant="outline" size="sm">
                    <ItemMedia variant="icon">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>Payload 3.88 API REST</ItemTitle>
                      <ItemDescription>Rotas de collections e endpoints tipados.</ItemDescription>
                    </ItemContent>
                    <Badge variant="outline">200 OK</Badge>
                  </Item>
                </ItemGroup>
              </CardContent>
            </Card>
          </div>

          {/* Empty State */}
          <Empty className="border border-dashed border-border bg-card/40">
            <EmptyMedia variant="icon">
              <Package className="h-5 w-5 text-muted-foreground" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Exemplo de Estado Vazio (<code className="text-xs bg-muted px-1 rounded font-mono">Empty</code>)</EmptyTitle>
              <EmptyDescription>
                Componente genérico para quando não há registros retornados pelas collections ou stores.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" variant="outline">Criar Primeiro Registro</Button>
            </EmptyContent>
          </Empty>
        </TabsContent>

        {/* Tab 4: Mobile & Shell */}
        <TabsContent value="mobile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Navegação Mobile & Layout Shell</CardTitle>
              <CardDescription>Componentes responsivos projetados para touch screens e safe-areas de smartphones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ActionRow
                  icon={<Home className="h-5 w-5" />}
                  title="AppShell"
                  subtitle="Container principal com slots para header, sidebar, main e bottomNav"
                  badge={<Badge variant="outline">Layout</Badge>}
                />
                <ActionRow
                  icon={<Compass className="h-5 w-5" />}
                  title="BottomTabs"
                  subtitle="Barra de abas com altura de 52px+, targets táteis e badges de aviso"
                  badge={<Badge variant="outline">Nav</Badge>}
                />
                <ActionRow
                  icon={<Bell className="h-5 w-5" />}
                  title="TopNav"
                  subtitle="Cabeçalho mobile com botão de voltar contextual e ações no topo"
                  badge={<Badge variant="outline">Header</Badge>}
                />
                <ActionRow
                  icon={<User className="h-5 w-5" />}
                  title="NavProvider / useNav"
                  subtitle="Contexto genérico de pilha de telas e gerenciamento de abas ativas"
                  badge={<Badge variant="outline">Context</Badge>}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
