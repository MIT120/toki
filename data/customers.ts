import { Customer, MeteringPoint } from '../src/types';

export async function getCustomerData(): Promise<Customer> {
    return {
        name: "My Amazing Bakery EOOD",
        owner: "Strahil",
        meteringPoints: ["1234", "5678"]
    };
}

export async function getMeteringPoints(): Promise<MeteringPoint[]> {
    const customer = await getCustomerData();

    return customer.meteringPoints.map(id => ({
        id,
        name: `Metering Point ${id}`,
        location: id === "1234" ? "Main Bakery Floor" : "Storage Area"
    }));
}

export async function getMeteringPointById(meteringPointId: string): Promise<MeteringPoint | null> {
    const meteringPoints = await getMeteringPoints();
    return meteringPoints.find(mp => mp.id === meteringPointId) || null;
}

export async function validateMeteringPointAccess(meteringPointId: string): Promise<boolean> {
    const customer = await getCustomerData();
    return customer.meteringPoints.includes(meteringPointId);
} 