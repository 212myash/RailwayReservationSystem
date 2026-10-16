
#ifndef BOOKING_H
#define BOOKING_H

#include <string>
#include <vector>

using namespace std;

struct Passenger {
    string name;
    int age;
    string gender;
};

class Booking {
private:
    string pnr;
    string trainNumber;
    string journeyDate;
    vector<Passenger> passengers;
    vector<int> seats;
    double totalFare;
    string status;

public:
    Booking();

    Booking(
        string bookingPNR,
        string number,
        string date,
        vector<Passenger> passengerList,
        vector<int> seatNumbers,
        double fare
    );

    string getPNR() const;
    string getTrainNumber() const;
    string getJourneyDate() const;
    double getTotalFare() const;
    string getStatus() const;

    vector<Passenger> getPassengers() const;
    vector<int> getSeats() const;

    void setStatus(string newStatus);
    void setSeats(vector<int> seatNumbers);

    void display() const;
};

#endif
