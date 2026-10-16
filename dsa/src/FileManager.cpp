
#include "../include/DSA.h"

#include <chrono>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>

using namespace std;

// Load train records from a text file.
// Format: number|name|source|destination|departure|arrival|fare|seats
bool loadTrainsFromFile(
    const string& filename,
    vector<Train>& trains
) {
    ifstream file(filename);

    if (!file.is_open()) {
        cerr << "Error: Could not open train file: "
             << filename << '\n';
        return false;
    }

    vector<Train> loadedTrains;
    string line;

    while (getline(file, line)) {
        if (line.empty()) {
            continue;
        }

        stringstream ss(line);

        string number, name, source, destination;
        string departure, arrival, fareText, seatsText;

        if (
            !getline(ss, number, '|') ||
            !getline(ss, name, '|') ||
            !getline(ss, source, '|') ||
            !getline(ss, destination, '|') ||
            !getline(ss, departure, '|') ||
            !getline(ss, arrival, '|') ||
            !getline(ss, fareText, '|') ||
            !getline(ss, seatsText)
        ) {
            cerr << "Warning: Invalid train record skipped.\n";
            continue;
        }

        try {
            size_t farePos = 0;
            size_t seatsPos = 0;

            double fare = stod(fareText, &farePos);
            int seats = stoi(seatsText, &seatsPos);

            if (
                fare < 0 ||
                seats <= 0 ||
                fareText.find_first_not_of(" \t\r\n", farePos)
                    != string::npos ||
                seatsText.find_first_not_of(" \t\r\n", seatsPos)
                    != string::npos
            ) {
                cerr << "Warning: Invalid train values skipped.\n";
                continue;
            }

            loadedTrains.emplace_back(
                number,
                name,
                source,
                destination,
                departure,
                arrival,
                fare,
                seats
            );
        } catch (...) {
            cerr << "Warning: Invalid train number/fare/seats skipped.\n";
        }
    }

    if (file.bad()) {
        cerr << "Error: Failed while reading train file.\n";
        return false;
    }

    trains = loadedTrains;
    return true;
}

// Load station records from a text file.
// Format: code|name|city|state
bool loadStationsFromFile(
    const string& filename,
    vector<Station>& stations
) {
    ifstream file(filename);

    if (!file.is_open()) {
        cerr << "Error: Could not open station file: "
             << filename << '\n';
        return false;
    }

    vector<Station> loadedStations;
    string line;

    while (getline(file, line)) {
        if (line.empty()) {
            continue;
        }

        stringstream ss(line);

        string code, name, city, state;

        if (
            !getline(ss, code, '|') ||
            !getline(ss, name, '|') ||
            !getline(ss, city, '|') ||
            !getline(ss, state)
        ) {
            cerr << "Warning: Invalid station record skipped.\n";
            continue;
        }

        if (
            code.empty() ||
            name.empty() ||
            city.empty() ||
            state.empty()
        ) {
            cerr << "Warning: Empty station field skipped.\n";
            continue;
        }

        loadedStations.emplace_back(code, name, city, state);
    }

    if (file.bad()) {
        cerr << "Error: Failed while reading station file.\n";
        return false;
    }

    stations = loadedStations;
    return true;
}

// Generate a PNR that does not match an existing in-memory booking.
string generatePNR(const vector<Booking>& bookings) {
    static unsigned long long counter = 0;

    while (true) {
        auto now = chrono::high_resolution_clock::now();

        auto timestamp =
            chrono::duration_cast<chrono::microseconds>(
                now.time_since_epoch()
            ).count();

        ++counter;

        string pnr = "PNR" + to_string(timestamp)
                     + to_string(counter);

        bool exists = false;

        for (const Booking& booking : bookings) {
            if (booking.getPNR() == pnr) {
                exists = true;
                break;
            }
        }

        if (!exists) {
            return pnr;
        }
    }
}

// Append one booking record to a text file.
// Format:
// PNR|TrainNumber|Date|Fare|Status|Seats|Passengers
//
// Empty seats are allowed for WAITING bookings.
bool saveBookingToFile(
    const string& filename,
    const Booking& booking
) {
    ofstream file(filename, ios::app);

    if (!file.is_open()) {
        cerr << "Error: Could not open booking file: "
             << filename << '\n';
        return false;
    }

    file << booking.getPNR() << '|'
         << booking.getTrainNumber() << '|'
         << booking.getJourneyDate() << '|'
         << fixed << setprecision(2)
         << booking.getTotalFare() << '|'
         << booking.getStatus() << '|';

    // Save seat numbers separated by commas.
    // For a WAITING booking, this field is empty.
    vector<int> seats = booking.getSeats();

    for (size_t i = 0; i < seats.size(); i++) {
        if (i > 0) {
            file << ',';
        }

        file << seats[i];
    }

    file << '|';

    // Save passengers as name,age,gender records.
    // Passenger records are separated by semicolons.
    vector<Passenger> passengers = booking.getPassengers();

    for (size_t i = 0; i < passengers.size(); i++) {
        if (i > 0) {
            file << ';';
        }

        string name = passengers[i].name;
        string gender = passengers[i].gender;

        // Protect the text-file delimiter format.
        for (char& ch : name) {
            if (ch == '|' || ch == ';' || ch == ',') {
                ch = ' ';
            }
        }

        for (char& ch : gender) {
            if (ch == '|' || ch == ';' || ch == ',') {
                ch = ' ';
            }
        }

        file << name << ','
             << passengers[i].age << ','
             << gender;
    }

    file << '\n';
    file.flush();

    if (!file.good()) {
        cerr << "Error: Failed to write booking record.\n";
        return false;
    }

    return true;
}
