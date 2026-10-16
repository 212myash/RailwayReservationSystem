
#include "../include/Booking.h"

#include <iostream>
#include <iomanip>

using namespace std;

Booking::Booking()
    : totalFare(0), status("CONFIRMED") {}

Booking::Booking(
    string bookingPNR,
    string number,
    string date,
    vector<Passenger> passengerList,
    vector<int> seatNumbers,
    double fare
)
    : pnr(bookingPNR),
      trainNumber(number),
      journeyDate(date),
      passengers(passengerList),
      seats(seatNumbers),
      totalFare(fare),
      status("CONFIRMED") {}

string Booking::getPNR() const {
    return pnr;
}

string Booking::getTrainNumber() const {
    return trainNumber;
}

string Booking::getJourneyDate() const {
    return journeyDate;
}

double Booking::getTotalFare() const {
    return totalFare;
}

string Booking::getStatus() const {
    return status;
}

vector<Passenger> Booking::getPassengers() const {
    return passengers;
}

vector<int> Booking::getSeats() const {
    return seats;
}

void Booking::setStatus(string newStatus) {
    status = newStatus;
}

void Booking::setSeats(vector<int> seatNumbers) {
    seats = seatNumbers;
}

void Booking::display() const {
    cout << "\n========== BOOKING DETAILS ==========\n";
    cout << "PNR          : " << pnr << '\n';
    cout << "Train Number : " << trainNumber << '\n';
    cout << "Journey Date : " << journeyDate << '\n';
    cout << "Status       : " << status << '\n';

    cout << "Seats        : ";

    if (seats.empty()) {
        cout << "Not allocated (Waiting List)";
    } else {
        for (size_t i = 0; i < seats.size(); i++) {
            cout << seats[i];

            if (i + 1 < seats.size()) {
                cout << ", ";
            }
        }
    }

    cout << "\nPassengers:\n";

    for (size_t i = 0; i < passengers.size(); i++) {
        cout << i + 1 << ". "
             << passengers[i].name
             << " | Age: " << passengers[i].age
             << " | Gender: " << passengers[i].gender
             << '\n';
    }

    cout << "Total Fare   : Rs. "
         << fixed << setprecision(2) << totalFare
         << '\n';

    cout << "=====================================\n";
}
