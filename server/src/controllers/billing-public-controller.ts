import { Request, Response } from "express";
import { GetPlansService } from "@/services/billing-service/get-plans-service";

const getPlansService = new GetPlansService();

export class BillingPublicController {
  async plans(_req: Request, res: Response) {
    try {
      const result = await getPlansService.execute();
      return res.json(result);
    } catch {
      return res.status(400).json({ message: "Error" });
    }
  }
}
