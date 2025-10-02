import { Rating } from 'src/rating/entities/rating-entity';

export class ResponseRatingDto {
  readonly id: string;
  readonly writingQuality: number;
  readonly updateStability: number;
  readonly plotDevelopment: number;
  readonly charactersBuilding: number;
  readonly worldBuilding: number;
  readonly createdAt: Date;

  constructor(rating: Rating) {
    this.id = rating.id;
    this.writingQuality = rating.writingQuality;
    this.updateStability = rating.updateStability;
    this.plotDevelopment = rating.plotDevelopment;
    this.charactersBuilding = rating.charactersBuilding;
    this.worldBuilding = rating.worldBuilding;
    this.createdAt = rating.createdAt;
  }
}
