Railway Reservation System (C++ DSA Project)
Project Overview
The Railway Reservation System is a menu-driven, command-line
application developed in C++. It demonstrates railway ticket booking
operations while applying core Data Structures and Algorithms (DSA)
concepts.
The project stores train, station, and booking information in text
files. It is designed to compile with g++ on Windows using the
supplied compile.bat script.
Features
- Display all trains.
- Search for trains using Linear Search and Binary Search.
- Sort trains by train number using Bubble Sort.
- Sort trains by fare using Insertion Sort.
- Search for stations by station code, name, or city.
- Display station information.
- Check available seats for a train.
- Book tickets for one or more passengers.
- Generate a PNR for each booking.
- Calculate total fare.
- View booking history.
- Cancel a confirmed booking and release its seats.
- Add a booking to the waiting list when sufficient seats are
  unavailable.
- Promote the first eligible waiting-list booking after a confirmed
  booking is cancelled, provided enough seats are available for all
  passengers in that waiting-list booking.
- Undo the most recent cancellation using a Stack during the current
  program session.
- Save and load booking records using text-file handling.
DSA Concepts Demonstrated
  Concept                             Use in the project
  vector                            Stores trains, stations,
                                      passengers, bookings, seat states,
                                      and seat numbers.
  Linear Search                       Finds a train or station by a key.
  Binary Search                       Searches trains after sorting them
                                      by train number.
  Bubble Sort                         Sorts trains by train number.
  Insertion Sort                      Sorts trains by fare.
  Stack (LIFO)                        Tracks cancellation history for
                                      Undo Cancellation during the
                                      current session.
  Queue-like waiting-list order       Waiting bookings are considered in
                                      the order in which they appear in
                                      booking records. The first waiting
                                      booking is not skipped if its
                                      entire party cannot be
                                      accommodated.
  Object-Oriented Programming         Uses classes such as Train,
                                      Station, and Booking.
  File Handling                       Reads and writes train, station,
                                  and booking data in text files.
Technology Used
- Language: C++
- Compiler: g++
- Interface: Command-line interface (CLI)
- Storage: Text files
- Build script: compile.bat
- External libraries: None required by the documented C++ core
  project
Project Structure
RailwayReservationSystem/
├── dsa/
│   ├── include/
│   │   ├── Train.h
│   │   ├── Station.h
│   │   ├── Booking.h
│   │   └── DSA.h
│   ├── src/
│   │   ├── main.cpp
│   │   ├── Train.cpp
│   │   ├── Station.cpp
│   │   ├── Booking.cpp
│   │   ├── Search.cpp
│   │   ├── Sorting.cpp
│   │   ├── Reservation.cpp
│   │   └── FileManager.cpp
│   ├── data/
│   │   ├── trains.txt
│   │   ├── stations.txt
│   │   └── bookings.txt
│   └── compile.bat
└── web/   # Separate web application, if included in this checkout
The structure above reflects the C++ DSA project layout discussed
during development. If your local folders or filenames differ, update
this section to match your actual repository.

How to Compile and Run on Windows
1. Install a C++ compiler that provides g++ and ensure it is
   available on your PATH.
2. Open PowerShell in the dsa directory.
3. Run:
   .\compile.bat
4. When the program starts, choose an option from the displayed menu.
5. Enter 0 to exit the program.
Run the program from the dsa directory so that the relative paths
under data/ resolve correctly.
Data Files
The application uses text files under dsa/data/:
- trains.txt --- train records.
- stations.txt --- station records.
- bookings.txt --- saved booking records, including PNR, train
  number, journey date, fare, status, seat numbers, and passenger
  details.
Important: Back up data/bookings.txt before manually editing data
or performing destructive tests.
Waiting-List Behaviour
- When the selected train cannot provide enough seats for all
  passengers in a booking, the booking can be saved with status
  WAITING and without allocated seats.
- After a confirmed booking is cancelled, the system checks the
  waiting list for that train.
- A waiting-list booking is promoted only if enough seats are
  available for every passenger in that booking.
- The first waiting booking is considered first; the system does not
  skip it to promote a later, smaller group.
Undo Cancellation
The Undo Cancellation feature uses a Stack and follows the Last In,
First Out (LIFO) principle. It is intended to undo the most recent
cancellation during the current running session. The undo history is not
persisted across program restarts.
Testing Checklist
The following checks have been reported as successful during manual
testing:
- Invalid menu option is handled without crashing.
- Unknown train number is rejected.
- Invalid passenger count is rejected.
- A booking with insufficient available seats is added to the waiting
  list.
- Invalid PNR cancellation is rejected without changing the booking.
- Undo with an empty Stack is handled.
- Invalid fare input is handled.
- Cancellation and Undo Cancellation work in the tested scenario.
Also verify after restarting the application that confirmed, cancelled,
and waiting bookings load with the expected statuses and that seat
availability is restored correctly.
Limitations and Notes
- This README documents the C++ command-line DSA component, not a
  verified integration between the C++ program and any separate web
  application or database.
- Undo history is session-only.
- The application uses local text files for persistence.
- Validate all file paths and filenames against the current repository
  before submission.
Academic Use
This project demonstrates searching, sorting, vectors, stack-based undo,
booking workflows, waiting-list handling, object-oriented design, and
file handling in a railway reservation scenario.
Before submitting, review the code yourself and be prepared to explain
each algorithm, its purpose, and its time complexity.