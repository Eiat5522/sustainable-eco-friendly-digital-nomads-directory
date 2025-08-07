|  Topic   | 	Schema Field   | 	API/DTO Field   | 	Description  |
|  Location field  |	location (geopoint)  |	coordinates (lat,lng)|




Column A | Column B | Column C
---------|----------|---------
 A1 | B1 | C1
 A2 | B2 | C2
 A3 | B3 | C3




### Conclusion
## Location
Listing schema uses `location` geopoint field with lat/lng but App DTO uses `coordinates` property. Featured listings query references `coordinates` which is not defined in the schema.
