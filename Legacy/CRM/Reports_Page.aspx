<%@ Page Title="Reports" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Reports_Page.aspx.vb" Inherits="_Default" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>

<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
 
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">

            <ContentTemplate>
                <asp:UpdateProgress runat="server" id="PageUpdateProgress">
            <ProgressTemplate>
                Loading...
            </ProgressTemplate>
        </asp:UpdateProgress>
                
                             &nbsp;<br />
                             <asp:Label ID="Lblguide" runat="server" ForeColor="Red"></asp:Label>
                      
                
                 <br />
                <asp:Panel ID="Panel1" runat="server" Height="485px" Width="1200px" 
                    BorderStyle="Groove" BorderWidth="1px" style="margin-left: 70px">
                    <table style="width: 1169px; height: 474px; margin-left: 0px; left: 50px;">
                        <tr>
                            <td rowspan="7" valign="top" style="width: 161px">
                            
                                <asp:Panel ID="Panel2" runat="server" BorderStyle="Dotted" Height="454px" 
                                    Width="644px">
                                    <table style="width: 100%; height: 100%;">
                                        <tr>
                                            <td style="width: 307px">
                                                <fieldset style="background-color:#DDDDDD; width: 289px;">
                                                    <legend>Main Reports</legend>
                                                    <asp:Panel ID="Panel3" runat="server" Height="412px" ScrollBars="Horizontal" 
                                                        Width="282px">
                                                        <telerik:RadListBox ID="MainRptRad" runat="server" AutoPostBack="True" 
                                                            Height="100%" Skin="Sunset" Width="100%">
                                                        </telerik:RadListBox>
                                                    </asp:Panel>
                                                </fieldset> &nbsp;</td>
                                            <td>
                                                <fieldset style="background-color:#DDDDDD; width: 286px;">
                                                    <legend>Sub Reports</legend>
                                                    <asp:Panel ID="Panel4" runat="server" Height="412px" ScrollBars="Horizontal" 
                                                        style="margin-left: 0px" Width="276px">
                                                        <telerik:RadListBox ID="SubRadRpt" runat="server" Height="100%" Skin="Sunset" 
                                                            Width="100%" AutoPostBack="True">
                                                        </telerik:RadListBox>
                                                    </asp:Panel>
                                                </fieldset> &nbsp;
                                            </td>
                                        </tr>
                                    </table>
                                </asp:Panel>
                            </td>
                            <td style="width: 214px; background-color: #C0C0C0;">
                                <asp:Label ID="Label6" runat="server" Text="Server"></asp:Label>
                            </td>
                            <td style="background-color: #C0C0C0">
                                <telerik:RadComboBox ID="cboserver" Runat="server" AutoPostBack="True">
                                    <Items>
                                        <telerik:RadComboBoxItem runat="server" />
                                        <telerik:RadComboBoxItem runat="server" Text="eOx Blue" Value="B" />
                                        <telerik:RadComboBoxItem runat="server" Text="eOx Red" Value="R" />
                                        <telerik:RadComboBoxItem runat="server" Text="CCA" Value="C" />
                                    </Items>
                                </telerik:RadComboBox>
                            </td>
                        </tr>
                        <tr>
                            <td style="width: 214px; background-color: #C0C0C0;">
                                <asp:Label ID="Label7" runat="server" Text="Provider"></asp:Label>
                            </td>
                            <td style="background-color: #C0C0C0">
                                <telerik:RadComboBox ID="cboprovider" Runat="server" MarkFirstMatch="True" 
                                    Width="250px">
                                </telerik:RadComboBox>
                            </td>
                        </tr>
                        <tr>
                            <td style="width: 214px; background-color: #C0C0C0;">
                                <asp:CheckBox ID="chkEntryDt" runat="server" Text="Entry Date From" />
                            </td>
                            <td style="background-color: #C0C0C0">
                                <telerik:RadDatePicker ID="dtDateFrom" Runat="server" Skin="Web20">
                                    <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                    </Calendar>
                                    <DateInput DateFormat="M/d/yyyy" DisplayDateFormat="M/d/yyyy">
                                    </DateInput>
                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                </telerik:RadDatePicker>
                            </td>
                        </tr>
                        <tr>
                            <td style="width: 214px; background-color: #C0C0C0;">
                                <asp:CheckBox ID="chkEntryDto" runat="server" Text="Entry Date To" />
                            </td>
                            <td style="background-color: #C0C0C0">
                                <telerik:RadDatePicker ID="dtDateTo" Runat="server" Skin="Web20">
                                    <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                        UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                    </Calendar>
                                    <DateInput DateFormat="M/d/yyyy" DisplayDateFormat="M/d/yyyy">
                                    </DateInput>
                                    <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                </telerik:RadDatePicker>
                            </td>
                        </tr>
                        <tr>
                            <td style="width: 214px; background-color: #C0C0C0;">
                                &nbsp;</td>
                            <td style="background-color: #C0C0C0">
                                &nbsp;</td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <asp:Label ID="LblErr" runat="server" ForeColor="Red"></asp:Label>
                            </td>
                        </tr>
                        <tr>
                            <td style="width: 214px">
                                &nbsp;</td>
                            <td>
                                <telerik:RadButton ID="RadButton1" runat="server" Skin="Sunset" Text="Extract" 
                                    Width="80%">
                                </telerik:RadButton>
                            </td>
                        </tr>
                    </table>
                </asp:Panel>                
            </ContentTemplate>
        </asp:UpdatePanel>
</asp:Content>

