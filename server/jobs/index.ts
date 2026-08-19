import type { TaskConfig, WorkflowConfig } from 'payload';

/**
 * JOBS (tasks + workflows).
 *
 * Task = unidade de trabalho assíncrona. `inputSchema`/`outputSchema` geram
 * tipos; `retries` define a política de retry (backoff exponencial). O generic
 * tipa `input`/`output` dentro do handler.
 */
export const echoTask: TaskConfig<{
  input: { message: string; failOnce?: boolean };
  output: { echoed: string; processedAt: string };
}> = {
  slug: 'echoTask',
  inputSchema: [
    { name: 'message', type: 'text', required: true },
    { name: 'failOnce', type: 'checkbox', defaultValue: false },
  ],
  outputSchema: [
    { name: 'echoed', type: 'text' },
    { name: 'processedAt', type: 'date' },
  ],
  retries: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
  handler: async ({ input }) => {
    // Erro = throw (o job re-tenta conforme `retries`). Sucesso = { output }.
    if (input.failOnce) {
      throw new Error('simulated failure');
    }
    return { output: { echoed: input.message, processedAt: new Date().toISOString() } };
  },
};

/** Task agendada (cron). Só roda de fato se `jobs.autoRun` estiver ligado. */
export const maintenanceTask: TaskConfig = {
  slug: 'maintenanceTask',
  schedule: [
    {
      cron: '0 0 * * *', // diário à meia-noite
      queue: 'maintenance',
      // hooks de agendamento (antes/depois de disparar o job):
      // hooks: { beforeSchedule: ..., afterSchedule: ... }
    },
  ],
  handler: async ({ req }) => {
    const { totalDocs } = await req.payload.count({ collection: 'posts' });
    return { output: { totalDocs } };
  },
};

/**
 * Workflow estilo 1: encadeia tasks nomeadas e lê o resultado de cada passo
 * em `job.taskStatus.<slug>.<id>.output`. (output fica tipado após generate:types)
 */
export const publishWorkflow: WorkflowConfig<{ post: string | number }> = {
  slug: 'publishWorkflow',
  inputSchema: [{ name: 'post', type: 'relationship', relationTo: 'posts' }],
  handler: async ({ job, tasks }) => {
    await tasks.echoTask('step-1', { input: { message: `processing ${job.input.post}` } });
    const echoed = (job.taskStatus?.echoTask?.['step-1']?.output as { echoed?: string } | undefined)?.echoed ?? '';
    await tasks.echoTask('step-2', { input: { message: `step-1 said: ${echoed}` } });
  },
};

/**
 * Workflow estilo 2: `inlineTask` define a task DENTRO do próprio workflow,
 * sem precisar de um TaskConfig separado (ótimo para passos descartáveis).
 */
export const inlineWorkflow: WorkflowConfig<{ message: string }> = {
  slug: 'inlineWorkflow',
  inputSchema: [{ name: 'message', type: 'text' }],
  handler: async ({ job, inlineTask }) => {
    const result = await inlineTask('step-a', {
      task: async ({ input }) => ({ output: { upper: input.message.toUpperCase() } }),
      input: { message: job.input.message },
    });
    await inlineTask('step-b', {
      task: async ({ input }) => ({ output: { length: input.message.length, first: result.upper } }),
      input: { message: job.input.message },
    });
  },
};
