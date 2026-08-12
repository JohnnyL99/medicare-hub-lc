import { models } from '../config/database.js';

export class DoctorServiceRepository {
  constructor(doctorServiceModel = models.DoctorService) {
    this.doctorServiceModel = doctorServiceModel;
  }

  async replaceServices(doctorId, medicalServiceIds, transaction) {
    await this.doctorServiceModel.destroy({
      where: {
        doctorId
      },
      transaction
    });

    if (!medicalServiceIds.length) {
      return [];
    }

    return this.doctorServiceModel.bulkCreate(
      medicalServiceIds.map((medicalServiceId) => ({
        doctorId,
        medicalServiceId
      })),
      { transaction }
    );
  }

  async exists(doctorId, medicalServiceId, transaction) {
    const entity = await this.doctorServiceModel.findOne({
      where: {
        doctorId,
        medicalServiceId
      },
      transaction
    });

    return Boolean(entity);
  }
}

export const doctorServiceRepository = new DoctorServiceRepository();
