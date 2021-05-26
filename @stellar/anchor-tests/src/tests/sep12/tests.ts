import { default as getCustomerTests } from "./getCustomer";
import { default as putCustomerTests } from "./putCustomer";
import { default as deleteCustomerTests } from "./deleteCustomer";

export default putCustomerTests.concat(getCustomerTests, deleteCustomerTests);
