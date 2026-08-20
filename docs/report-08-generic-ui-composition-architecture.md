# Relatório 08 — Arquitetura de Componentes Genéricos e Padrão de Composição (`components/ui/` e `components/app/`)

## 1. Contexto e Diretriz de Design

Para pavimentar e habilitar a criação de múltiplos remixes e novas camadas (`layers/` ou apps secundárias) sobre este template, toda a base de componentes de interface foi reformulada para o **padrão de composição pura (compound components + `data-slot` + Tailwind v4 + CVA)**.

Nenhum componente em `components/ui/` ou `components/app/` carrega regras de negócio ou amarras a domínios específicos. Tudo é desacoplado, extensível e reutilizável pelo app root e pelas layers.

---

## 2. Catálogo de Componentes Genéricos Implementados

### Em `components/ui/` (Primitivos Atômicos e Componíveis):
1. **Ações & Botões**:
   - `button.tsx` (`Button`, `buttonVariants` com variantes `default`, `secondary`, `outline`, `ghost`, `destructive`, `link` e tamanhos `xs`, `sm`, `default`, `lg`, `icon`).
   - `button-group.tsx` (`ButtonGroup`).
   - `toggle.tsx` (`Toggle`) & `toggle-group.tsx` (`ToggleGroup`).
   - `kbd.tsx` (`Kbd` para atalhos de teclado).
2. **Formulários & Entradas**:
   - `field.tsx` (`Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldSet`, `FieldLegend`).
   - `input.tsx` (`Input`) & `textarea.tsx` (`Textarea`).
   - `input-group.tsx` (`InputGroup`, `InputGroupAddon`, `InputGroupButton` para ícones, botões integrados e tags).
   - `checkbox.tsx` (`Checkbox`), `switch.tsx` (`Switch`), `radio-group.tsx` (`RadioGroup`).
   - `slider.tsx` (`Slider`), `native-select.tsx` (`NativeSelect`), `select.tsx` (`Select`).
   - `input-otp.tsx` (`InputOTP`).
3. **Estrutura & Listas**:
   - `card.tsx` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`).
   - `item.tsx` (`Item`, `ItemGroup`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemAction`).
   - `empty.tsx` (`Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`).
   - `separator.tsx` (`Separator`), `aspect-ratio.tsx` (`AspectRatio`), `scroll-area.tsx` (`ScrollArea`), `table.tsx` (`Table`).
   - `accordion.tsx` (`Accordion`) & `collapsible.tsx` (`Collapsible`).
4. **Overlays & Feedback**:
   - `dialog.tsx` (`Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`).
   - `drawer.tsx` (`Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, `DrawerFooter`, `DrawerClose` — bottom sheet mobile).
   - `sheet.tsx` (`Sheet` lateral), `popover.tsx` (`Popover`), `dropdown-menu.tsx` (`DropdownMenu`), `tooltip.tsx` (`Tooltip`), `hover-card.tsx` (`HoverCard`).
   - `alert.tsx` (`Alert`, `AlertTitle`, `AlertDescription`), `alert-dialog.tsx` (`AlertDialog`).
   - `badge.tsx` (`Badge`), `progress.tsx` (`Progress`), `skeleton.tsx` (`Skeleton`), `spinner.tsx` (`Spinner`), `toast.tsx` (`Toast`).
5. **Navegação & Mídia**:
   - `tabs.tsx` (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`).
   - `breadcrumb.tsx` (`Breadcrumb`), `pagination.tsx` (`Pagination`).
   - `avatar.tsx` (`Avatar`, `AvatarImage`, `AvatarFallback`).

### Em `components/app/` (Layout Shell Genérico e Mobile-First):
- **`AppShell`**: Shell com slots para `header`, `sidebar` (desktop), `main` (conteúdo com maxWidth configurável), `bottomNav` (mobile) e `footer`.
- **`BottomTabs`**: Barra de navegação inferior mobile para touch targets acessíveis (48px+), suporte a badges, ícones e estados ativos.
- **`TopNav`**: Barra de topo contextual com botão de voltar, títulos e ações à direita/esquerda.
- **`NavProvider` / `useNav`**: Contexto genérico para histórico de navegação e abas ativas.
- **`AvatarBadge`**, **`StarRating`**, **`VerifiedBadge`**, **`FavoriteButton`**, **`ActionRow`**, **`ScreenHeader`**: Componentes auxiliares genéricos para compor telas ricas.

---

## 3. Verificações e Testes

- **`bunx tsc --noEmit`**: 0 erros.
- **`bunx oxlint --quiet ...`**: 0 erros em 74 arquivos.
- **`bun run build` & `compile_applet`**: 100% de sucesso.
- **Showcase Interativo**: Acessível na rota `/components`, demonstrando cada grupo de componentes e seus comportamentos.
