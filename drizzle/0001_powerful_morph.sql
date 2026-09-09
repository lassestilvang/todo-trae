CREATE TABLE "task_dependencies" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"depends_on_task_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_task_id_tasks_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_task_deps_task_id" ON "task_dependencies" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_deps_depends_on" ON "task_dependencies" USING btree ("depends_on_task_id");