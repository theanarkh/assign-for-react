
try to solve the problem of react assign.

in react, when updating a field of an object, especially a deep object, it will make the code difficult to maintain. Try to write an assign tool, you just need to declare the fields and values that need to be modified. The tool will returns a new object, but shares the values of fields that do not need to be modified. Only modify the value of the field you declare, and from the object where the field is declared to the object on the path to the root will be modified.