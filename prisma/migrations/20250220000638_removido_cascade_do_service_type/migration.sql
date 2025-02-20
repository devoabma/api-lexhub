-- DropForeignKey
ALTER TABLE "service_service_types" DROP CONSTRAINT "service_service_types_service_type_id_fkey";

-- AddForeignKey
ALTER TABLE "service_service_types" ADD CONSTRAINT "service_service_types_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
