#include "../include/DSA.h"
#include <iostream>
#include <limits>
#include <vector>
#include <string>
#include <fstream>
#include <sstream>
#include <stack>
using namespace std;
// Display train table header.
void displayTrainHeader() {
    cout << "\n"
         << "Train No.   "
         << "Train Name             "
         << "Source         "
         << "Destination    "
         << "Departure "
         << "Arrival   "
         << "Fare      "
         << "Seats\n";
    cout << string(105, '-') << '\n';
}
void displayTrains(const vector<Train>& trains) {
    displayTrainHeader();
    for (const Train& train : trains) {
        train.display();
    }
}
// Find a train's index by its train number.
int findTrainIndex(
    const vector<Train>& trains,
    const string& number
) {
    return linearSearchTrain(trains, number);
}
// Split a string using a delimiter.
vector<string> splitText(
    const string& text,
    char delimiter
) {
    vector<string> parts;
    string part;
    stringstream ss(text);
    while (getline(ss, part, delimiter)) {
        parts.push_back(part);
    }
    return parts;
}
// Load saved booking records from bookings.txt.
bool loadSavedBookings(
    const string& filename,
    const vector<Train>& trains,
    vector<Booking>& bookings,
    vector<vector<bool>>& occupiedSeats
) {
    ifstream file(filename);
    if (!file.is_open()) {
        cerr << "Warning: Could not open " << filename << '\n';
        return false;
    }
    string line;
    while (getline(file, line)) {
        if (line.empty()) {
            continue;
        }
        vector<string> fields = splitText(line, '|');
        // Expected format:
        // PNR|TrainNumber|Date|Fare|Status|Seats|Passengers
        if (fields.size() != 7) {
            cerr << "Warning: Invalid booking record skipped.\n";
            continue;
        }
        try {
            string pnr = fields[0];
            string trainNumber = fields[1];
            string date = fields[2];
            double fare = stod(fields[3]);
            string status = fields[4];
            vector<int> seats;
            vector<Passenger> passengers;
            if (!fields[5].empty()) {
                vector<string> seatParts =
                    splitText(fields[5], ',');
                for (const string& seatText : seatParts) {
                    size_t pos = 0;
                    int seat = stoi(seatText, &pos);
                    if (pos != seatText.size() || seat <= 0) {
                        throw invalid_argument("Invalid seat");
                    }
                    seats.push_back(seat);
                }
            }
            if (!fields[6].empty()) {
                vector<string> passengerParts =
                    splitText(fields[6], ';');
                for (const string& record : passengerParts) {
                    vector<string> details =
                        splitText(record, ',');
                    if (details.size() != 3) {
                        throw invalid_argument(
                            "Invalid passenger record"
                        );
                    }
                    Passenger passenger;
                    passenger.name = details[0];
                    size_t agePos = 0;
                    passenger.age = stoi(details[1], &agePos);
                    if (
                        agePos != details[1].size() ||
                        passenger.age <= 0
                    ) {
                        throw invalid_argument("Invalid age");
                    }
                    passenger.gender = details[2];
                    passengers.push_back(passenger);
                }
            }
            if (
                pnr.empty() ||
                trainNumber.empty() ||
                date.empty() ||
                fare < 0 ||
                passengers.empty() ||
                (status == "WAITING"
                    ? !seats.empty()
                    : seats.size() != passengers.size()) ||
                (status != "CONFIRMED" &&
                 status != "CANCELLED" &&
                 status != "WAITING")
            ) {
                throw invalid_argument("Invalid booking");
            }
            Booking booking(
                pnr,
                trainNumber,
                date,
                passengers,
                seats,
                fare
            );
            booking.setStatus(status);
            bookings.push_back(booking);
            // Restore occupied seats for confirmed bookings.
            if (status == "CONFIRMED") {
                int trainIndex =
                    findTrainIndex(trains, trainNumber);
                if (trainIndex != -1) {
                    if (!reserveSeats(
                            occupiedSeats[trainIndex],
                            seats
                        )) {
                        cerr << "Warning: Could not restore seats "
                             << "for PNR " << pnr << ".\n";
                    }
                }
            }
        } catch (...) {
            cerr << "Warning: Invalid booking record skipped.\n";
        }
    }
    if (file.bad()) {
        cerr << "Error while reading booking file.\n";
        return false;
    }
    return true;
}
// Rewrite booking file after cancellation.
bool rewriteBookingsFile(
    const string& filename,
    const vector<Booking>& bookings
) {
    {
        ofstream file(filename, ios::trunc);
        if (!file.is_open()) {
            cerr << "Error: Could not rewrite booking file.\n";
            return false;
        }
    }
    for (const Booking& booking : bookings) {
        if (!saveBookingToFile(filename, booking)) {
            cerr << "Error while rewriting booking records.\n";
            return false;
        }
    }
    return true;
}
// Promote the first waiting booking for this train when all passengers fit.
// Queue order is the order in which bookings appear in bookings.txt.
bool promoteFirstWaiting(
    const string& filename,
    const string& trainNumber,
    const vector<Train>& trains,
    vector<Booking>& bookings,
    vector<vector<bool>>& occupiedSeats,
    string* promotedPNR = nullptr
) {
    int trainIndex = findTrainIndex(trains, trainNumber);
    if (trainIndex == -1) return false;

    for (size_t i = 0; i < bookings.size(); ++i) {
        Booking& waiting = bookings[i];
        if (waiting.getTrainNumber() != trainNumber ||
            waiting.getStatus() != "WAITING") {
            continue;
        }

        int required = static_cast<int>(waiting.getPassengers().size());
        vector<int> seats = allocateSeats(occupiedSeats[trainIndex], required);
        // Preserve FIFO: do not skip the first waiting party.
        if (seats.size() != static_cast<size_t>(required)) return false;
        if (!reserveSeats(occupiedSeats[trainIndex], seats)) return false;

        waiting.setSeats(seats);
        waiting.setStatus("CONFIRMED");
        if (!rewriteBookingsFile(filename, bookings)) {
            releaseSeats(occupiedSeats[trainIndex], seats);
            waiting.setSeats(vector<int>());
            waiting.setStatus("WAITING");
            cerr << "Warning: Could not save waiting-list promotion.\n";
            return false;
        }

        cout << "\nWaiting-list booking promoted successfully!\n";
        cout << "PNR: " << waiting.getPNR() << '\n';
        cout << "Allocated seats: ";
        for (int seat : seats) cout << seat << ' ';
        cout << '\n';
        if (promotedPNR != nullptr) *promotedPNR = waiting.getPNR();
        return true;
    }
    return false;
}
struct CancellationRecord {
    Booking booking;
    string promotedPNR;

    CancellationRecord(const Booking& cancelled, const string& promoted)
        : booking(cancelled), promotedPNR(promoted) {}
};

int main() {
    stack<CancellationRecord> cancellationStack;
    vector<Train> trains;
    vector<Station> stations;
    vector<Booking> bookings;
    if (!loadTrainsFromFile("data/trains.txt", trains)) {
        cerr << "Failed to load trains.\n";
        return 1;
    }
    if (!loadStationsFromFile("data/stations.txt", stations)) {
        cerr << "Failed to load stations.\n";
        return 1;
    }
    if (trains.empty() || stations.empty()) {
        cerr << "Train or station data is empty.\n";
        return 1;
    }
    // Each train gets its own seat-status vector.
    vector<vector<bool>> occupiedSeats;
    for (const Train& train : trains) {
        occupiedSeats.emplace_back(
            static_cast<size_t>(train.getTotalSeats()),
            false
        );
    }
    // Load saved bookings and restore occupied seats.
    if (!loadSavedBookings(
            "data/bookings.txt",
            trains,
            bookings,
            occupiedSeats
        )) {
        cerr << "Could not load existing bookings.\n";
        return 1;
    }
    cout << "Loaded " << trains.size() << " trains.\n";
    cout << "Loaded " << stations.size() << " stations.\n";
    cout << "Loaded " << bookings.size() << " booking records.\n";
    int choice;
    do {
        cout << "\n====================================\n";
        cout << "   RAILWAY RESERVATION SYSTEM\n";
        cout << "        DSA PROJECT\n";
        cout << "====================================\n";
        cout << "1. Display all trains\n";
        cout << "2. Search train (Linear Search)\n";
        cout << "3. Search train (Binary Search)\n";
        cout << "4. Sort trains by number (Bubble Sort)\n";
        cout << "5. Sort trains by fare (Insertion Sort)\n";
        cout << "6. Search station by code\n";
        cout << "7. Search stations by name/city\n";
        cout << "8. Display stations\n";
        cout << "9. Show available seats for a train\n";
        cout << "10. Book tickets\n";
        cout << "11. Cancel booking by PNR\n";
        cout << "12. Calculate total fare\n";
        cout << "13. View booking history\n";
        cout << "14. View waiting list\n";
        cout << "15. Undo last cancellation (Stack)\n";
        cout << "0. Exit\n";
        cout << "Enter choice: ";
        if (!(cin >> choice)) {
            cin.clear();
            cin.ignore(
                numeric_limits<streamsize>::max(),
                '\n'
            );
            cout << "Invalid input. Enter a number.\n";
            continue;
        }
        switch (choice) {
            case 1: {
                displayTrains(trains);
                break;
            }
            case 2: {
                string number;
                cout << "Enter train number: ";
                cin >> number;
                int index = linearSearchTrain(trains, number);
                if (index == -1) {
                    cout << "Train not found.\n";
                } else {
                    trains[index].display();
                }
                break;
            }
            case 3: {
                string number;
                cout << "Enter train number: ";
                cin >> number;
                vector<Train> sortedTrains = trains;
                bubbleSortTrainsByNumber(sortedTrains);
                int index = binarySearchTrain(
                    sortedTrains,
                    number
                );
                if (index == -1) {
                    cout << "Train not found.\n";
                } else {
                    sortedTrains[index].display();
                }
                break;
            }
            case 4: {
                bubbleSortTrainsByNumber(trains);
                cout << "Trains sorted by number.\n";
                displayTrains(trains);
                break;
            }
            case 5: {
                insertionSortTrainsByFare(trains);
                cout << "Trains sorted by fare.\n";
                displayTrains(trains);
                break;
            }
            case 6: {
                string code;
                cout << "Enter station code: ";
                cin >> code;
                int index = linearSearchStation(stations, code);
                if (index == -1) {
                    cout << "Station not found.\n";
                } else {
                    stations[index].display();
                }
                break;
            }
            case 7: {
                string query;
                cout << "Enter station name, city or code: ";
                cin >> ws;
                getline(cin, query);
                vector<int> results =
                    searchStationsByName(stations, query);
                if (results.empty()) {
                    cout << "No matching stations found.\n";
                } else {
                    for (int index : results) {
                        stations[index].display();
                        cout << "--------------------\n";
                    }
                }
                break;
            }
            case 8: {
                for (const Station& station : stations) {
                    station.display();
                    cout << "--------------------\n";
                }
                break;
            }
            case 9: {
                string number;
                cout << "Enter train number: ";
                cin >> number;
                int index = findTrainIndex(trains, number);
                if (index == -1) {
                    cout << "Train not found.\n";
                    break;
                }
                cout << "Available seats for "
                     << trains[index].getTrainName() << ": ";
                bool found = false;
                for (
                    size_t i = 0;
                    i < occupiedSeats[index].size();
                    i++
                ) {
                    if (!occupiedSeats[index][i]) {
                        cout << i + 1 << " ";
                        found = true;
                    }
                }
                if (!found) {
                    cout << "None";
                }
                cout << '\n';
                break;
            }
            case 10: {
                string number;
                displayTrains(trains);
                cout << "\nEnter train number to book: ";
                cin >> number;
                int trainIndex = findTrainIndex(trains, number);
                if (trainIndex == -1) {
                    cout << "Train not found.\n";
                    break;
                }
                int passengerCount;
                cout << "Number of passengers: ";
                if (!(cin >> passengerCount)) {
                    cin.clear();
                    cin.ignore(
                        numeric_limits<streamsize>::max(),
                        '\n'
                    );
                    cout << "Invalid passenger count.\n";
                    break;
                }
                if (
                    passengerCount <= 0 ||
                    passengerCount >
                        static_cast<int>(
                            occupiedSeats[trainIndex].size()
                        )
                ) {
                    cout << "Invalid passenger count.\n";
                    break;
                }
                vector<int> selectedSeats = allocateSeats(
                    occupiedSeats[trainIndex],
                    passengerCount
                );
                bool waitingListBooking = (selectedSeats.size() != static_cast<size_t>(passengerCount));
                if (waitingListBooking) {
                    cout << "No sufficient seats available.\n";
                    cout << "This booking will be added to the waiting list.\n";
                }
                vector<Passenger> passengers;
                bool passengerInputValid = true;
                for (int i = 0; i < passengerCount; i++) {
                    Passenger passenger;
                    cout << "\nPassenger " << i + 1 << " name: ";
                    cin >> ws;
                    getline(cin, passenger.name);
                    cout << "Age: ";
                    if (!(cin >> passenger.age)) {
                        cin.clear();
                        cin.ignore(
                            numeric_limits<streamsize>::max(),
                            '\n'
                        );
                        passengerInputValid = false;
                        break;
                    }
                    if (
                        passenger.name.empty() ||
                        passenger.age <= 0 ||
                        passenger.age > 120 ||
                        passenger.name.find('|') != string::npos ||
                        passenger.name.find(';') != string::npos ||
                        passenger.name.find(',') != string::npos
                    ) {
                        cout << "Invalid passenger details. "
                             << "Avoid | ; , in names.\n";
                        passengerInputValid = false;
                        break;
                    }
                    cout << "Gender: ";
                    cin >> ws;
                    getline(cin, passenger.gender);
                    if (
                        passenger.gender.empty() ||
                        passenger.gender.find('|') != string::npos ||
                        passenger.gender.find(';') != string::npos ||
                        passenger.gender.find(',') != string::npos
                    ) {
                        cout << "Invalid gender input.\n";
                        passengerInputValid = false;
                        break;
                    }
                    passengers.push_back(passenger);
                }
                if (
                    !passengerInputValid ||
                    static_cast<int>(passengers.size()) != passengerCount
                ) {
                    cout << "Booking cancelled due to invalid details.\n";
                    break;
                }
                string journeyDate;
                cout << "Journey date (YYYY-MM-DD): ";
                cin >> journeyDate;
                if (
                    journeyDate.size() != 10 ||
                    journeyDate[4] != '-' ||
                    journeyDate[7] != '-'
                ) {
                    cout << "Invalid date format.\n";
                    break;
                }
                double totalFare = calculateTotalFare(
                    trains[trainIndex].getFare(),
                    passengerCount
                );
                string pnr = generatePNR(bookings);
                Booking booking(
                    pnr,
                    number,
                    journeyDate,
                    passengers,
                    selectedSeats,
                    totalFare
                );
                if (waitingListBooking) {
                    booking.setStatus("WAITING");
                }
                cout << "\n========== BOOKING SUMMARY ==========\n";
                cout << "PNR          : " << pnr << '\n';
                cout << "Train        : "
                     << trains[trainIndex].getTrainName() << '\n';
                cout << "Journey Date : " << journeyDate << '\n';
                cout << "Status       : " << booking.getStatus() << '\n';
                cout << "Seats        : ";
                if (waitingListBooking) {
                    cout << "Not allocated (Waiting List)";
                } else {
                    for (int seat : selectedSeats) {
                        cout << seat << " ";
                    }
                }
                cout << "\nPassengers   : " << passengerCount;
                cout << "\nTotal Fare   : Rs. " << totalFare << '\n';
                cout << "Confirm booking? (1 = Yes, 0 = No): ";
                int confirm;
                if (!(cin >> confirm)) {
                    cin.clear();
                    cin.ignore(
                        numeric_limits<streamsize>::max(),
                        '\n'
                    );
                    cout << "Invalid input. Booking cancelled.\n";
                    break;
                }
                if (confirm != 1) {
                    cout << "Booking cancelled.\n";
                    break;
                }
                if (!waitingListBooking &&
                    !reserveSeats(
                        occupiedSeats[trainIndex],
                        selectedSeats
                    )) {
                    cout << "Seat allocation failed.\n";
                    break;
                }
                if (!saveBookingToFile(
                        "data/bookings.txt",
                        booking
                    )) {
                    if (!waitingListBooking) {
                        releaseSeats(
                            occupiedSeats[trainIndex],
                            selectedSeats
                        );
                    }
                    cout << "Could not save booking. "
                         << "Seats have been released.\n";
                    break;
                }
                bookings.push_back(booking);
                if (waitingListBooking) {
                    cout << "\nBooking added to waiting list successfully!\n";
                } else {
                    cout << "\nBooking successful!\n";
                }
                booking.display();
                break;
            }
            case 11: {
                string pnr;
                cout << "Enter PNR to cancel: ";
                cin >> pnr;
                int bookingIndex = -1;
                for (
                    size_t i = 0;
                    i < bookings.size();
                    i++
                ) {
                    if (
                        bookings[i].getPNR() == pnr &&
                        bookings[i].getStatus() == "CONFIRMED"
                    ) {
                        bookingIndex = static_cast<int>(i);
                        break;
                    }
                }
                if (bookingIndex == -1) {
                    cout << "Confirmed booking not found.\n";
                    break;
                }
                int trainIndex = findTrainIndex(
                    trains,
                    bookings[bookingIndex].getTrainNumber()
                );
                if (trainIndex == -1) {
                    cout << "Booking train not found.\n";
                    break;
                }
                vector<int> seats =
                    bookings[bookingIndex].getSeats();
                if (!releaseSeats(
                        occupiedSeats[trainIndex],
                        seats
                    )) {
                    cout << "Could not release booking seats.\n";
                    break;
                }
                bookings[bookingIndex].setStatus("CANCELLED");
                if (!rewriteBookingsFile(
                        "data/bookings.txt",
                        bookings
                    )) {
                    bookings[bookingIndex].setStatus("CONFIRMED");
                    reserveSeats(occupiedSeats[trainIndex], seats);
                    cout << "Warning: Booking file rewrite failed; cancellation rolled back.\n";
                    break;
                }
                Booking cancelledBooking = bookings[bookingIndex];
                string cancelledTrainNumber =
                    bookings[bookingIndex].getTrainNumber();
                string promotedPNR;
                cout << "Booking cancelled successfully.\n";
                cout << "PNR: " << pnr << '\n';
                promoteFirstWaiting(
                    "data/bookings.txt",
                    cancelledTrainNumber,
                    trains,
                    bookings,
                    occupiedSeats,
                    &promotedPNR
                );
                cancellationStack.push(
                    CancellationRecord(cancelledBooking, promotedPNR)
                );
                cout << "Undo is available during this program session.\n";
                break;
            }
            case 12: {
                double fare;
                int passengers;
                cout << "Fare per passenger: ";
                if (!(cin >> fare)) {
                    cin.clear();
                    cin.ignore(
                        numeric_limits<streamsize>::max(),
                        '\n'
                    );
                    cout << "Invalid fare.\n";
                    break;
                }
                cout << "Number of passengers: ";
                if (!(cin >> passengers)) {
                    cin.clear();
                    cin.ignore(
                        numeric_limits<streamsize>::max(),
                        '\n'
                    );
                    cout << "Invalid passenger count.\n";
                    break;
                }
                if (fare < 0 || passengers <= 0) {
                    cout << "Invalid fare or passenger count.\n";
                    break;
                }
                cout << "Total fare: Rs. "
                     << calculateTotalFare(fare, passengers)
                     << '\n';
                break;
            }
            case 13: {
                if (bookings.empty()) {
                    cout << "No booking records found.\n";
                } else {
                    for (const Booking& booking : bookings) {
                        booking.display();
                    }
                }
                break;
            }
            case 14: {
                bool foundWaiting = false;
                for (const Booking& booking : bookings) {
                    if (booking.getStatus() == "WAITING") {
                        booking.display();
                        foundWaiting = true;
                    }
                }
                if (!foundWaiting) {
                    cout << "No waiting-list bookings found.\n";
                }
                break;
            }
            case 15: {
                if (cancellationStack.empty()) {
                    cout << "No cancellation available to undo.\n";
                    break;
                }

                CancellationRecord record = cancellationStack.top();
                int cancelledIndex = -1;
                for (size_t i = 0; i < bookings.size(); ++i) {
                    if (bookings[i].getPNR() == record.booking.getPNR() &&
                        bookings[i].getStatus() == "CANCELLED") {
                        cancelledIndex = static_cast<int>(i);
                        break;
                    }
                }

                if (cancelledIndex == -1) {
                    cout << "The cancelled booking cannot be found.\n";
                    break;
                }

                int trainIndex = findTrainIndex(
                    trains, record.booking.getTrainNumber()
                );
                if (trainIndex == -1) {
                    cout << "Booking train not found.\n";
                    break;
                }

                int promotedIndex = -1;
                if (!record.promotedPNR.empty()) {
                    for (size_t i = 0; i < bookings.size(); ++i) {
                        if (bookings[i].getPNR() == record.promotedPNR &&
                            bookings[i].getStatus() == "CONFIRMED") {
                            promotedIndex = static_cast<int>(i);
                            break;
                        }
                    }
                }

                vector<int> promotedSeats;
                if (promotedIndex != -1) {
                    promotedSeats = bookings[promotedIndex].getSeats();
                    if (!releaseSeats(occupiedSeats[trainIndex], promotedSeats)) {
                        cout << "Could not release promoted booking seats.\n";
                        break;
                    }
                    bookings[promotedIndex].setStatus("WAITING");
                    bookings[promotedIndex].setSeats(vector<int>());
                }

                vector<int> restoreSeats = record.booking.getSeats();
                if (!reserveSeats(occupiedSeats[trainIndex], restoreSeats)) {
                    if (promotedIndex != -1) {
                        reserveSeats(occupiedSeats[trainIndex], promotedSeats);
                        bookings[promotedIndex].setSeats(promotedSeats);
                        bookings[promotedIndex].setStatus("CONFIRMED");
                    }
                    cout << "Undo failed: original seats are not available.\n";
                    break;
                }

                bookings[cancelledIndex].setSeats(restoreSeats);
                bookings[cancelledIndex].setStatus("CONFIRMED");
                if (!rewriteBookingsFile("data/bookings.txt", bookings)) {
                    bookings[cancelledIndex].setStatus("CANCELLED");
                    releaseSeats(occupiedSeats[trainIndex], restoreSeats);
                    if (promotedIndex != -1) {
                        reserveSeats(occupiedSeats[trainIndex], promotedSeats);
                        bookings[promotedIndex].setSeats(promotedSeats);
                        bookings[promotedIndex].setStatus("CONFIRMED");
                    }
                    cout << "Undo could not be saved; changes rolled back.\n";
                    break;
                }

                cancellationStack.pop();
                cout << "Last cancellation undone successfully!\n";
                cout << "Restored PNR: " << record.booking.getPNR() << '\n';
                if (promotedIndex != -1) {
                    cout << "Waiting-list PNR " << record.promotedPNR
                         << " returned to WAITING status.\n";
                }
                break;
            }
            case 0: {
                cout << "Thank you for using the system.\n";
                break;
            }
            default: {
                cout << "Invalid choice. Try again.\n";
            }
        }
    } while (choice != 0);
    return 0;
}