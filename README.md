# V4W Frontend

## About
Vets4Warriors UI. Purpose is to allow V4W counselors to easily view and add resources.

## Components

### Main Page
Allow a user to open the call interface, resource list, or add a resource.
### Take a Call Page
[TBD, pending walkthrough]
*Concept:* User enters caller's location into address search bar. Map plugin [TBD: Google or D3] searches the address against entries in the database, and displays on the map (and in a list) top (10?) entries. Options to narrow search by service category/tag.
### List Resources Page
Lists all resources, allowing for them to be sorted and narrowed by all categories. Also allows editing individual resources.
### Add/Edit Page
Form page containing fields for each element of a resource. When called as an edit page, fields are filled in with existing values, and saving PUTs instead of POST.