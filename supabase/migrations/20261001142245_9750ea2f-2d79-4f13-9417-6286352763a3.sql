create type public.app_role as enum ('admin','auditor','empresa');
create type public.answer_status as enum ('cumple','parcial','no_cumple','no_aplica');
create type public.action_status as enum ('pendiente','en_curso','cerrada');

create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create or replace function public.is_staff(_user_id uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role in ('admin','auditor')) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.profiles (id uuid primary key, full_name text, company_name text, nit text, phone text, created_at timestamptz not null default now());
grant select, insert, update on public.profiles to authenticated; grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "profiles insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, company_name, nit, phone) values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'company_name', new.raw_user_meta_data->>'nit', new.raw_user_meta_data->>'phone');
  insert into public.user_roles (user_id, role) values (new.id, 'empresa');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.standards (id uuid primary key default gen_random_uuid(), code text unique not null, name text not null, description text, sort int not null default 0);
create table public.chapters (id uuid primary key default gen_random_uuid(), standard_id uuid not null references public.standards(id) on delete cascade, code text not null, title text not null, sort int not null default 0);
create table public.requirements (id uuid primary key default gen_random_uuid(), chapter_id uuid not null references public.chapters(id) on delete cascade, code text not null, question text not null, weight int not null default 1, sort int not null default 0);
grant select on public.standards, public.chapters, public.requirements to anon, authenticated;
grant insert, update, delete on public.standards, public.chapters, public.requirements to authenticated;
grant all on public.standards, public.chapters, public.requirements to service_role;
alter table public.standards enable row level security; alter table public.chapters enable row level security; alter table public.requirements enable row level security;
create policy "read standards" on public.standards for select using (true);
create policy "read chapters" on public.chapters for select using (true);
create policy "read reqs" on public.requirements for select using (true);
create policy "admin standards" on public.standards for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin chapters" on public.chapters for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin reqs" on public.requirements for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.assessments (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), standard_id uuid not null references public.standards(id), title text, status text not null default 'en_progreso', auditor_notes text, created_at timestamptz not null default now(), completed_at timestamptz);
grant select, insert, update, delete on public.assessments to authenticated; grant all on public.assessments to service_role;
alter table public.assessments enable row level security;
create policy "assess read" on public.assessments for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "assess insert" on public.assessments for insert to authenticated with check (user_id = auth.uid());
create policy "assess update" on public.assessments for update to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "assess delete" on public.assessments for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.can_access_assessment(_aid uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.assessments a where a.id=_aid and (a.user_id=auth.uid() or public.is_staff(auth.uid()))) $$;

create table public.answers (id uuid primary key default gen_random_uuid(), assessment_id uuid not null references public.assessments(id) on delete cascade, requirement_id uuid not null references public.requirements(id) on delete cascade, status answer_status, comment text, evidence text, finding text, updated_at timestamptz not null default now(), unique(assessment_id, requirement_id));
grant select, insert, update, delete on public.answers to authenticated; grant all on public.answers to service_role;
alter table public.answers enable row level security;
create policy "answers all" on public.answers for all to authenticated using (public.can_access_assessment(assessment_id)) with check (public.can_access_assessment(assessment_id));

create table public.action_items (id uuid primary key default gen_random_uuid(), assessment_id uuid not null references public.assessments(id) on delete cascade, requirement_id uuid references public.requirements(id) on delete set null, action text not null, responsible text, due_date date, status action_status not null default 'pendiente', created_at timestamptz not null default now());
grant select, insert, update, delete on public.action_items to authenticated; grant all on public.action_items to service_role;
alter table public.action_items enable row level security;
create policy "actions all" on public.action_items for all to authenticated using (public.can_access_assessment(assessment_id)) with check (public.can_access_assessment(assessment_id));

create table public.contact_messages (id uuid primary key default gen_random_uuid(), name text not null, email text not null, company text, phone text, service text, message text not null, created_at timestamptz not null default now());
grant insert on public.contact_messages to anon, authenticated; grant select on public.contact_messages to authenticated; grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;
create policy "contact insert" on public.contact_messages for insert to anon, authenticated with check (length(name) between 1 and 120 and length(email) between 3 and 255 and length(message) between 1 and 2000);
create policy "contact read" on public.contact_messages for select to authenticated using (public.is_staff(auth.uid()));

-- Seed
insert into public.standards (code,name,description,sort) values
('ISO9001','ISO 9001:2015','Sistema de Gestión de la Calidad',1),
('ISO27001','ISO/IEC 27001:2022','Sistema de Gestión de Seguridad de la Información',2),
('ISO14001','ISO 14001:2015','Sistema de Gestión Ambiental',3),
('ISO45001','ISO 45001:2018','Sistema de Gestión de Seguridad y Salud en el Trabajo',4),
('SGSST','SG-SST Resolución 0312 de 2019','Estándares mínimos del Sistema de Gestión de SST (Colombia)',5),
('COMPLIANCE','Compliance Legal B2B','SAGRILAFT, PTEE, Habeas Data (Ley 1581) y gobierno corporativo',6);

with d(std, ccode, ctitle, csort, rcode, q, rsort) as (values
('ISO9001','4','Contexto de la organización',1,'4.1','¿Se han determinado las cuestiones externas e internas pertinentes al propósito de la organización?',1),
('ISO9001','4','Contexto de la organización',1,'4.2','¿Se han identificado las partes interesadas y sus requisitos?',2),
('ISO9001','4','Contexto de la organización',1,'4.3','¿Está documentado el alcance del sistema de gestión de la calidad?',3),
('ISO9001','4','Contexto de la organización',1,'4.4','¿Se han determinado los procesos del SGC y sus interacciones (mapa de procesos)?',4),
('ISO9001','5','Liderazgo',2,'5.1','¿La alta dirección demuestra liderazgo y compromiso con el SGC?',1),
('ISO9001','5','Liderazgo',2,'5.2','¿Existe una política de calidad documentada, comunicada y entendida?',2),
('ISO9001','5','Liderazgo',2,'5.3','¿Están asignados y comunicados los roles, responsabilidades y autoridades?',3),
('ISO9001','6','Planificación',3,'6.1','¿Se han identificado y tratado los riesgos y oportunidades?',1),
('ISO9001','6','Planificación',3,'6.2','¿Existen objetivos de calidad medibles con planes para lograrlos?',2),
('ISO9001','6','Planificación',3,'6.3','¿Se planifican los cambios del SGC de forma controlada?',3),
('ISO9001','7','Apoyo',4,'7.1','¿Se proveen los recursos necesarios (personas, infraestructura, ambiente)?',1),
('ISO9001','7','Apoyo',4,'7.2','¿Se determina y evidencia la competencia del personal?',2),
('ISO9001','7','Apoyo',4,'7.4','¿Se ha definido la comunicación interna y externa?',3),
('ISO9001','7','Apoyo',4,'7.5','¿Se controla la información documentada (versiones, acceso, conservación)?',4),
('ISO9001','8','Operación',5,'8.2','¿Se determinan y revisan los requisitos de productos y servicios?',1),
('ISO9001','8','Operación',5,'8.4','¿Se evalúan y controlan los proveedores externos?',2),
('ISO9001','8','Operación',5,'8.5','¿Se controla la producción y prestación del servicio?',3),
('ISO9001','8','Operación',5,'8.7','¿Se controlan las salidas no conformes?',4),
('ISO9001','9','Evaluación del desempeño',6,'9.1','¿Se mide la satisfacción del cliente y se analizan los datos?',1),
('ISO9001','9','Evaluación del desempeño',6,'9.2','¿Se realizan auditorías internas planificadas?',2),
('ISO9001','9','Evaluación del desempeño',6,'9.3','¿La alta dirección realiza la revisión por la dirección?',3),
('ISO9001','10','Mejora',7,'10.2','¿Se gestionan no conformidades y acciones correctivas?',1),
('ISO9001','10','Mejora',7,'10.3','¿Se evidencia la mejora continua del SGC?',2),

('ISO27001','4','Contexto',1,'4.3','¿Está definido el alcance del SGSI?',1),
('ISO27001','5','Liderazgo',2,'5.2','¿Existe una política de seguridad de la información aprobada?',1),
('ISO27001','6','Planificación',3,'6.1.2','¿Se realiza una evaluación de riesgos de seguridad de la información?',1),
('ISO27001','6','Planificación',3,'6.1.3','¿Existe una Declaración de Aplicabilidad (SoA)?',2),
('ISO27001','7','Apoyo',4,'7.3','¿El personal recibe concientización en seguridad de la información?',1),
('ISO27001','8','Operación',5,'8.2','¿Se ejecutan periódicamente las evaluaciones de riesgo?',1),
('ISO27001','A.5','Controles organizacionales',6,'A.5.9','¿Existe un inventario de activos de información?',1),
('ISO27001','A.5','Controles organizacionales',6,'A.5.15','¿Se gestiona el control de acceso según el principio de mínimo privilegio?',2),
('ISO27001','A.5','Controles organizacionales',6,'A.5.24','¿Existe un procedimiento de gestión de incidentes?',3),
('ISO27001','A.8','Controles tecnológicos',7,'A.8.7','¿Hay protección contra malware?',1),
('ISO27001','A.8','Controles tecnológicos',7,'A.8.13','¿Se realizan y prueban copias de respaldo?',2),
('ISO27001','A.8','Controles tecnológicos',7,'A.8.24','¿Se usa cifrado para información sensible?',3),
('ISO27001','9','Evaluación',8,'9.2','¿Se realizan auditorías internas del SGSI?',1),

('ISO14001','4','Contexto',1,'4.3','¿Está definido el alcance del sistema de gestión ambiental?',1),
('ISO14001','5','Liderazgo',2,'5.2','¿Existe una política ambiental con compromiso de protección del medio ambiente?',1),
('ISO14001','6','Planificación',3,'6.1.2','¿Se identifican aspectos e impactos ambientales significativos?',1),
('ISO14001','6','Planificación',3,'6.1.3','¿Se identifican y cumplen los requisitos legales ambientales?',2),
('ISO14001','6','Planificación',3,'6.2','¿Existen objetivos ambientales medibles?',3),
('ISO14001','8','Operación',4,'8.1','¿Se controlan las operaciones asociadas a aspectos significativos (residuos, vertimientos, emisiones)?',1),
('ISO14001','8','Operación',4,'8.2','¿Existe un plan de preparación y respuesta ante emergencias ambientales?',2),
('ISO14001','9','Evaluación',5,'9.1.2','¿Se evalúa periódicamente el cumplimiento legal ambiental?',1),
('ISO14001','10','Mejora',6,'10.2','¿Se gestionan no conformidades ambientales?',1),

('ISO45001','5','Liderazgo y participación',1,'5.2','¿Existe una política de SST?',1),
('ISO45001','5','Liderazgo y participación',1,'5.4','¿Se consulta y garantiza la participación de los trabajadores?',2),
('ISO45001','6','Planificación',2,'6.1.2','¿Se identifican peligros y evalúan riesgos (matriz IPEVR)?',1),
('ISO45001','6','Planificación',2,'6.1.3','¿Se identifican los requisitos legales de SST?',2),
('ISO45001','7','Apoyo',3,'7.2','¿Se capacita al personal en SST?',1),
('ISO45001','8','Operación',4,'8.1.2','¿Se aplica la jerarquía de controles para eliminar peligros?',1),
('ISO45001','8','Operación',4,'8.2','¿Existe plan de emergencias con simulacros?',2),
('ISO45001','9','Evaluación',5,'9.1','¿Se miden indicadores de accidentalidad y ausentismo?',1),
('ISO45001','10','Mejora',6,'10.2','¿Se investigan incidentes y se toman acciones correctivas?',1),

('SGSST','I','Planear',1,'1.1.1','¿Se ha asignado un responsable del SG-SST con licencia y curso de 50 horas?',1),
('SGSST','I','Planear',1,'1.1.4','¿Todos los trabajadores están afiliados al Sistema de Riesgos Laborales?',2),
('SGSST','I','Planear',1,'1.1.6','¿Está conformado el COPASST o Vigía de SST?',3),
('SGSST','I','Planear',1,'1.1.8','¿Está conformado el Comité de Convivencia Laboral?',4),
('SGSST','I','Planear',1,'2.1.1','¿Existe política de SST firmada, fechada y comunicada?',5),
('SGSST','I','Planear',1,'2.4.1','¿Existe un plan anual de trabajo firmado?',6),
('SGSST','II','Hacer',2,'3.1.1','¿Se cuenta con el diagnóstico de condiciones de salud?',1),
('SGSST','II','Hacer',2,'3.1.4','¿Se realizan evaluaciones médicas ocupacionales?',2),
('SGSST','II','Hacer',2,'3.2.1','¿Se reportan los accidentes de trabajo a la ARL y EPS?',3),
('SGSST','II','Hacer',2,'4.1.2','¿Se identifican peligros con participación de todos los niveles?',4),
('SGSST','II','Hacer',2,'5.1.1','¿Existe plan de prevención, preparación y respuesta ante emergencias?',5),
('SGSST','III','Verificar',3,'6.1.2','¿Se realiza auditoría anual del SG-SST con participación del COPASST?',1),
('SGSST','III','Verificar',3,'6.1.3','¿La alta dirección revisa anualmente el SG-SST?',2),
('SGSST','IV','Actuar',4,'7.1.1','¿Se definen acciones preventivas y correctivas a partir de resultados?',1),

('COMPLIANCE','1','SAGRILAFT / LA-FT-FPADM',1,'1.1','¿La empresa está obligada y ha implementado el SAGRILAFT o régimen de medidas mínimas?',1),
('COMPLIANCE','1','SAGRILAFT / LA-FT-FPADM',1,'1.2','¿Existe un Oficial de Cumplimiento designado por la junta directiva?',2),
('COMPLIANCE','1','SAGRILAFT / LA-FT-FPADM',1,'1.3','¿Se realiza debida diligencia y consulta en listas restrictivas a clientes y proveedores?',3),
('COMPLIANCE','2','Transparencia y Ética (PTEE)',2,'2.1','¿Existe un Programa de Transparencia y Ética Empresarial aprobado?',1),
('COMPLIANCE','2','Transparencia y Ética (PTEE)',2,'2.2','¿Existe canal de denuncias anónimo y confidencial?',2),
('COMPLIANCE','2','Transparencia y Ética (PTEE)',2,'2.3','¿Se cuenta con código de ética y conducta divulgado?',3),
('COMPLIANCE','3','Protección de Datos (Ley 1581)',3,'3.1','¿Existe política de tratamiento de datos personales publicada?',1),
('COMPLIANCE','3','Protección de Datos (Ley 1581)',3,'3.2','¿Se obtienen autorizaciones del titular para el tratamiento?',2),
('COMPLIANCE','3','Protección de Datos (Ley 1581)',3,'3.3','¿Las bases de datos están registradas en el RNBD de la SIC?',3),
('COMPLIANCE','4','Gobierno corporativo y contractual',4,'4.1','¿Los contratos con clientes y proveedores incluyen cláusulas de cumplimiento?',1),
('COMPLIANCE','4','Gobierno corporativo y contractual',4,'4.2','¿Los libros societarios y actas están al día?',2)
),
ch as (
  insert into public.chapters (standard_id, code, title, sort)
  select distinct s.id, d.ccode, d.ctitle, d.csort from d join public.standards s on s.code=d.std
  returning id, standard_id, code
)
insert into public.requirements (chapter_id, code, question, sort)
select ch.id, d.rcode, d.q, d.rsort from d join public.standards s on s.code=d.std join ch on ch.standard_id=s.id and ch.code=d.ccode;
