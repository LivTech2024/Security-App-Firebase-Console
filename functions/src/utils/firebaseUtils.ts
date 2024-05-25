import { ICompaniesCollection, IEmployeesCollection } from '../@types/database';
import { CollectionName } from '../@types/enum';
import { securityAppAdmin } from '../methods/firebaseInit';

export const getCompanyDetails = async (cmpId: string) => {
  const cmpSnapshot = await securityAppAdmin
    .firestore()
    .doc(`${CollectionName.companies}/${cmpId}`)
    .get();
  return cmpSnapshot.data() as ICompaniesCollection;
};

export const getEmpDetails = async (empId: string) => {
  const empSnapshot = await securityAppAdmin
    .firestore()
    .doc(`${CollectionName.employees}/${empId}`)
    .get();

  return empSnapshot?.data() as IEmployeesCollection;
};
